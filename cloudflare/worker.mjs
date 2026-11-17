const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const DEFAULT_REPOSITORY = 'nanzhi84/open-source-pulse-wall';
const DEFAULT_COOLDOWN_MS = 180000;

const COMMIT_GRAPH_LIMIT = 40;
const ACTIVITY_FEED_LIMIT = 8;
const CONTRIBUTORS_FETCH_LIMIT = 100;
const ISSUES_FETCH_LIMIT = 100;
const PULLS_FETCH_LIMIT = 100;
const ISSUES_DISPLAY_LIMIT = 10;
const PULLS_DISPLAY_LIMIT = 10;
const RECENT_CHEERS_LIMIT = 12;

const CHEERS_MAX_PER_PROFILE = 50;
const CHEER_MESSAGE_MAX_LENGTH = 80;
const ALLOWED_AVATARS = new Set(
  Array.from({ length: 11 }, (_, index) => `avatars/avatar-${String(index + 1).padStart(2, '0')}.png`)
);

const REPO_OWNER_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Expose-Headers': 'Retry-After',
  'Cache-Control': 'no-store'
};

const edgeCache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
let memoryBundle = null;
let inFlightRefresh = null;

/**
 * Reset module-level in-memory buffer and inflight state for deterministic unit tests.
 */
export function resetMemoryBundleForTests() {
  memoryBundle = null;
  inFlightRefresh = null;
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

function formatCooldownText(seconds) {
  const total = Math.max(1, Math.ceil(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) return `${secs}秒`;
  return secs > 0 ? `${mins}分${String(secs).padStart(2, '0')}秒` : `${mins}分钟`;
}

function buildGithubHeaders(token = '', extra = {}) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'open-source-pulse-wall-worker',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGithubJsonWithHeaders(pathname, token = '') {
  const response = await fetch(`${GITHUB_API_BASE}${pathname}`, {
    headers: buildGithubHeaders(token)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 240)}`);
  }

  return {
    data: await response.json(),
    link: response.headers?.get('link') || ''
  };
}

async function fetchGithubJson(pathname, token = '') {
  const result = await fetchGithubJsonWithHeaders(pathname, token);
  return result.data;
}

function parseNextPagePath(linkHeader) {
  if (!linkHeader) return '';

  const nextLink = String(linkHeader)
    .split(',')
    .map((entry) => entry.trim())
    .find((entry) => /;\s*rel="next"/.test(entry));

  if (!nextLink) return '';

  const match = /^<([^>]+)>/.exec(nextLink);
  if (!match) return '';

  try {
    const parsed = new URL(match[1], GITHUB_API_BASE);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return '';
  }
}

async function fetchGithubCollection(pathname, token = '', { maxItems = 100 } = {}) {
  const items = [];
  let nextPath = pathname;
  let truncated = false;

  while (nextPath) {
    const result = await fetchGithubJsonWithHeaders(nextPath, token);
    const pageItems = Array.isArray(result.data) ? result.data : [];
    items.push(...pageItems);
    nextPath = parseNextPagePath(result.link);

    if (items.length >= maxItems) {
      truncated = Boolean(nextPath);
      break;
    }
  }

  return {
    data: items.slice(0, maxItems),
    truncated
  };
}

async function fetchOptionalCollection(pathname, token, options = {}) {
  try {
    const result = await fetchGithubCollection(pathname, token, options);
    return { data: result.data, truncated: result.truncated, warning: '' };
  } catch (error) {
    return { data: [], truncated: false, warning: error.message };
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateGithubHandle(value) {
  if (typeof value !== 'string') return 'github 必须是字符串';
  const trimmed = value.trim();
  if (!trimmed) return 'github 不能为空';
  if (trimmed.length > 39) return 'github 不能超过 39 个字符';
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) return 'github 只能包含字母、数字和连字符';
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) return 'github 不能以连字符开头或结尾';
  if (trimmed.includes('--')) return 'github 不能包含连续连字符';
  return null;
}

function isHttpUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function requiredString(profile, key, label, errors, filename, maxLength = 80) {
  const value = profile[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${filename}: ${label} 必须填写`);
    return;
  }

  if (value.trim().length > maxLength) {
    errors.push(`${filename}: ${label} 过长，最多 ${maxLength} 个字符`);
  }
}

function validateCheers(profile, filename, errors) {
  if (profile.cheers === undefined) return;

  if (!Array.isArray(profile.cheers)) {
    errors.push(`${filename}: cheers 必须是数组，例如 [{ "from": "octocat", "message": "加油!" }]`);
    return;
  }

  if (profile.cheers.length > CHEERS_MAX_PER_PROFILE) {
    errors.push(`${filename}: cheers 最多 ${CHEERS_MAX_PER_PROFILE} 条，请合并或删减`);
  }

  const owner = String(profile.github || '').trim().toLowerCase();
  const seen = new Set();

  profile.cheers.forEach((entry, index) => {
    const label = `cheers[${index}]`;

    if (!isPlainObject(entry)) {
      errors.push(`${filename}: ${label} 必须是对象 { from, message }`);
      return;
    }

    const fromProblem = validateGithubHandle(entry.from);
    if (fromProblem) {
      errors.push(`${filename}: ${label}.from ${fromProblem}`);
    }

    const fromHandle = String(entry.from || '').trim().toLowerCase();
    if (owner && fromHandle && fromHandle === owner) {
      errors.push(`${filename}: ${label}.from 不能是 profile 主人自己（请让别的同学给你加油）`);
    }

    if (typeof entry.message !== 'string' || entry.message.trim().length === 0) {
      errors.push(`${filename}: ${label}.message 必须填写`);
    } else if (entry.message.trim().length > CHEER_MESSAGE_MAX_LENGTH) {
      errors.push(`${filename}: ${label}.message 过长，最多 ${CHEER_MESSAGE_MAX_LENGTH} 个字符`);
    }

    if (entry.ts !== undefined) {
      if (typeof entry.ts !== 'string' || Number.isNaN(Date.parse(entry.ts))) {
        errors.push(`${filename}: ${label}.ts 必须是 ISO 时间字符串，例如 2026-05-09`);
      }
    }

    const dedupeKey = `${fromHandle}|${String(entry.message || '').trim()}`;
    if (fromHandle && seen.has(dedupeKey)) {
      errors.push(`${filename}: ${label} 与之前同一作者的同样内容重复，请合并`);
    } else if (fromHandle) {
      seen.add(dedupeKey);
    }
  });
}

function validateProfile(profile, filename) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(profile)) {
    return { errors: [`${filename}: 文件内容必须是一个 JSON 对象`], warnings };
  }

  requiredString(profile, 'name', 'name', errors, filename, 40);
  requiredString(profile, 'github', 'github', errors, filename, 39);
  requiredString(profile, 'motto', 'motto', errors, filename, 120);

  const githubProblem = validateGithubHandle(profile.github);
  if (githubProblem) {
    errors.push(`${filename}: ${githubProblem}`);
  }

  if (profile.city !== undefined && (typeof profile.city !== 'string' || profile.city.trim().length > 40)) {
    errors.push(`${filename}: city 必须是 40 个字符以内的字符串`);
  }

  if (profile.avatar !== undefined) {
    if (typeof profile.avatar !== 'string') {
      errors.push(`${filename}: avatar 必须是字符串`);
    } else {
      const avatar = profile.avatar.trim();
      if (!ALLOWED_AVATARS.has(avatar) && !isHttpsUrl(avatar)) {
        errors.push(`${filename}: avatar 只能使用 ${Array.from(ALLOWED_AVATARS).join(', ')} 中的一个，或 https:// 开头的图片 URL`);
      }
    }
  }

  if (profile.homepage !== undefined) {
    if (typeof profile.homepage !== 'string') {
      errors.push(`${filename}: homepage 必须是字符串`);
    } else if (!isHttpUrl(profile.homepage)) {
      errors.push(`${filename}: homepage 必须是 http:// 或 https:// 开头的有效 URL`);
    }
  }

  validateCheers(profile, filename, errors);

  const expectedName = `${String(profile.github || '').trim().toLowerCase()}.json`;
  if (profile.github && filename.toLowerCase() !== expectedName) {
    warnings.push(`${filename}: 建议文件名改成 ${expectedName}，这样维护者更容易定位贡献者`);
  }

  return { errors, warnings };
}

function normalizeCheers(rawCheers) {
  if (!Array.isArray(rawCheers)) return [];

  return rawCheers
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const from = String(entry.from || '').trim();
      const message = String(entry.message || '').trim();
      if (!from || !message) return null;
      return {
        from,
        message,
        ts: typeof entry.ts === 'string' ? entry.ts : ''
      };
    })
    .filter(Boolean);
}

function normalizeContributors(contributors) {
  return contributors
    .map((item) => ({
      name: String(item.name || '').trim(),
      github: String(item.github || '').trim(),
      motto: String(item.motto || '').trim(),
      city: String(item.city || '').trim(),
      avatar: String(item.avatar || '').trim(),
      homepage: String(item.homepage || '').trim(),
      cheers: normalizeCheers(item.cheers),
      file: item.file
    }))
    .filter((item) => item.name || item.github);
}

function collectRecentCheers(contributors) {
  const items = [];
  contributors.forEach((profile) => {
    profile.cheers.forEach((cheer) => {
      items.push({
        to: profile.github || profile.name,
        toName: profile.name || profile.github,
        from: cheer.from,
        message: cheer.message,
        ts: cheer.ts || ''
      });
    });
  });

  items.sort((a, b) => {
    const at = Date.parse(a.ts || '') || 0;
    const bt = Date.parse(b.ts || '') || 0;
    return bt - at;
  });

  return items.slice(0, RECENT_CHEERS_LIMIT);
}

async function computeFingerprint(profileEntries) {
  const summary = profileEntries
    .map((entry) => `${entry.file}:${entry.text.length}`)
    .join('|');
  const bytes = new TextEncoder().encode(summary);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchProfileEntriesViaGraphql(owner, name, token) {
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: "HEAD:data/profiles") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  text
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: buildGithubHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query, variables: { owner, name } })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub GraphQL ${response.status}: ${body.slice(0, 240)}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload.errors) && payload.errors.length) {
    throw new Error(`GitHub GraphQL error: ${payload.errors[0].message || 'unknown error'}`);
  }

  const entries = payload?.data?.repository?.object?.entries;
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry) => entry.type === 'blob' && entry.name.endsWith('.json') && !entry.name.startsWith('_'))
    .map((entry) => ({
      file: entry.name,
      text: String(entry.object?.text ?? '')
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

async function fetchProfileEntriesViaContents(encodedRepo, token) {
  const items = await fetchGithubJson(`/repos/${encodedRepo}/contents/data/profiles`, token);
  if (!Array.isArray(items)) return [];

  const jsonItems = items
    .filter((item) => item.type === 'file' && item.name.endsWith('.json') && !item.name.startsWith('_'))
    .sort((a, b) => a.name.localeCompare(b.name));

  return Promise.all(
    jsonItems.map(async (item) => {
      const response = await fetch(item.download_url, {
        headers: { 'User-Agent': 'open-source-pulse-wall-worker' }
      });
      if (!response.ok) {
        throw new Error(`Profile fetch failed (${item.name}): HTTP ${response.status}`);
      }
      return {
        file: item.name,
        text: await response.text()
      };
    })
  );
}

async function fetchProfileEntries(repository, encodedRepo, token) {
  const [owner, name] = repository.split('/');
  if (token) {
    try {
      return await fetchProfileEntriesViaGraphql(owner, name, token);
    } catch {
      // Fall back to REST contents API if GraphQL fails or lacks scope.
    }
  }
  return fetchProfileEntriesViaContents(encodedRepo, token);
}

function validateAndNormalizeProfileEntries(profileEntries) {
  const errors = [];
  const warnings = [];
  const rawContributors = [];
  const seenGithub = new Map();

  for (const entry of profileEntries) {
    let profile;
    try {
      profile = JSON.parse(entry.text);
    } catch (error) {
      errors.push(`${entry.file}: JSON 解析失败，${error.message}`);
      continue;
    }

    const result = validateProfile(profile, entry.file);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    if (profile && profile.github) {
      const key = String(profile.github).trim().toLowerCase();
      if (seenGithub.has(key)) {
        errors.push(`${entry.file}: github ${profile.github} 已经在 ${seenGithub.get(key)} 中出现过`);
      } else {
        seenGithub.set(key, entry.file);
      }
    }

    rawContributors.push({ ...profile, file: entry.file });
  }

  return {
    contributors: normalizeContributors(rawContributors),
    errors,
    warnings
  };
}

function pickCommitTime(commit) {
  return commit?.commit?.committer?.date || commit?.commit?.author?.date || '';
}

function pickCommitAuthorLogin(commit) {
  return String(commit?.author?.login || commit?.commit?.author?.name || 'unknown');
}

function pickCommitMessageHeader(commit) {
  return String(commit?.commit?.message || 'Commit').split('\n')[0];
}

function normalizeCommitNode(commit) {
  return {
    sha: String(commit.sha || ''),
    shortSha: String(commit.sha || '').slice(0, 7),
    parents: Array.isArray(commit.parents)
      ? commit.parents.map((parent) => String(parent.sha || '')).filter(Boolean)
      : [],
    author: pickCommitAuthorLogin(commit),
    avatarUrl: String(commit?.author?.avatar_url || ''),
    profileUrl: String(commit?.author?.html_url || ''),
    message: pickCommitMessageHeader(commit),
    time: pickCommitTime(commit),
    htmlUrl: String(commit.html_url || '')
  };
}

function normalizeIssueNode(node) {
  return {
    number: Number(node.number || 0),
    title: String(node.title || '').trim(),
    state: String(node.state || 'open'),
    isPullRequest: Boolean(node.pull_request),
    author: String(node.user?.login || 'unknown'),
    avatarUrl: String(node.user?.avatar_url || ''),
    profileUrl: String(node.user?.html_url || ''),
    htmlUrl: String(node.html_url || ''),
    createdAt: String(node.created_at || ''),
    updatedAt: String(node.updated_at || ''),
    closedAt: String(node.closed_at || ''),
    commentCount: Number(node.comments || 0),
    labels: Array.isArray(node.labels)
      ? node.labels
          .map((label) => ({
            name: String(label.name || ''),
            color: String(label.color || '')
          }))
          .filter((label) => label.name)
      : []
  };
}

function normalizePullRequestNode(node) {
  const reviewers = Array.isArray(node.requested_reviewers) ? node.requested_reviewers : [];
  const teams = Array.isArray(node.requested_teams) ? node.requested_teams : [];
  return {
    number: Number(node.number || 0),
    title: String(node.title || '').trim(),
    state: String(node.state || 'open'),
    draft: Boolean(node.draft),
    author: String(node.user?.login || 'unknown'),
    avatarUrl: String(node.user?.avatar_url || ''),
    profileUrl: String(node.user?.html_url || ''),
    htmlUrl: String(node.html_url || ''),
    createdAt: String(node.created_at || ''),
    updatedAt: String(node.updated_at || ''),
    requestedReviewers: reviewers
      .map((reviewer) => ({
        login: String(reviewer.login || ''),
        avatarUrl: String(reviewer.avatar_url || ''),
        profileUrl: String(reviewer.html_url || '')
      }))
      .filter((reviewer) => reviewer.login),
    requestedTeams: teams.map((team) => String(team.name || team.slug || '')).filter(Boolean)
  };
}

function buildActivityEvents({ commits, issues, pullRequests }) {
  const events = [];

  commits.forEach((commit) => {
    events.push({
      type: 'commit',
      time: commit.time,
      author: commit.author,
      avatarUrl: commit.avatarUrl,
      htmlUrl: commit.htmlUrl,
      message: `${commit.author}: ${commit.message}`,
      key: `commit:${commit.sha}`
    });
  });

  issues.filter((item) => !item.isPullRequest).forEach((issue) => {
    const isClosed = issue.state === 'closed' && issue.closedAt;
    events.push({
      type: isClosed ? 'issue_closed' : 'issue_opened',
      time: isClosed ? issue.closedAt : issue.createdAt,
      author: issue.author,
      avatarUrl: issue.avatarUrl,
      htmlUrl: issue.htmlUrl,
      message: isClosed
        ? `@${issue.author} 关闭了 Issue #${issue.number}: ${issue.title}`
        : `@${issue.author} 提了 Issue #${issue.number}: ${issue.title}`,
      key: `${isClosed ? 'issue_closed' : 'issue_opened'}:${issue.number}`
    });
  });

  issues.filter((item) => item.isPullRequest).forEach((pr) => {
    const isClosed = pr.state === 'closed' && pr.closedAt;
    events.push({
      type: isClosed ? 'pr_closed' : 'pr_opened',
      time: isClosed ? pr.closedAt : pr.createdAt,
      author: pr.author,
      avatarUrl: pr.avatarUrl,
      htmlUrl: pr.htmlUrl,
      message: isClosed
        ? `@${pr.author} 合并/关闭了 PR #${pr.number}: ${pr.title}`
        : `@${pr.author} 开了 PR #${pr.number}: ${pr.title}`,
      key: `${isClosed ? 'pr_closed' : 'pr_opened'}:${pr.number}`
    });
  });

  pullRequests.forEach((pr) => {
    if (!pr.requestedReviewers.length && !pr.requestedTeams.length) return;
    const reviewerNames = [
      ...pr.requestedReviewers.map((reviewer) => `@${reviewer.login}`),
      ...pr.requestedTeams.map((team) => `@${team}`)
    ];
    events.push({
      type: 'review_requested',
      time: pr.updatedAt || pr.createdAt,
      author: pr.author,
      avatarUrl: pr.avatarUrl,
      htmlUrl: pr.htmlUrl,
      message: `@${pr.author} 请 ${reviewerNames.join('、')} review PR #${pr.number}: ${pr.title}`,
      key: `review_requested:${pr.number}:${reviewerNames.join(',')}`
    });
  });

  events.sort((a, b) => {
    const at = Date.parse(a.time || '') || 0;
    const bt = Date.parse(b.time || '') || 0;
    return bt - at;
  });

  return events;
}

async function fetchPackedWallState({ repository, token = '' }) {
  if (!REPO_OWNER_NAME.test(repository)) {
    throw new Error('仓库标识必须使用 owner/repo 格式');
  }

  const encodedRepo = repository.split('/').map(encodeURIComponent).join('/');

  const [profileEntries, repo, contributorsResult, commits, issuesResult, pullsResult] = await Promise.all([
    fetchProfileEntries(repository, encodedRepo, token),
    fetchGithubJson(`/repos/${encodedRepo}`, token),
    fetchGithubCollection(
      `/repos/${encodedRepo}/contributors?per_page=100`,
      token,
      { maxItems: CONTRIBUTORS_FETCH_LIMIT }
    ),
    fetchGithubJson(`/repos/${encodedRepo}/commits?per_page=${COMMIT_GRAPH_LIMIT}`, token),
    fetchOptionalCollection(
      `/repos/${encodedRepo}/issues?state=all&sort=updated&direction=desc&per_page=100`,
      token,
      { maxItems: ISSUES_FETCH_LIMIT }
    ),
    fetchOptionalCollection(
      `/repos/${encodedRepo}/pulls?state=open&sort=created&direction=desc&per_page=100`,
      token,
      { maxItems: PULLS_FETCH_LIMIT }
    )
  ]);

  const fingerprint = await computeFingerprint(profileEntries);
  const { contributors: normalized, errors, warnings } = validateAndNormalizeProfileEntries(profileEntries);
  const ok = errors.length === 0;
  const contributors = ok ? normalized : [];
  const cheersTotal = contributors.reduce((sum, profile) => sum + profile.cheers.length, 0);
  const recentCheers = collectRecentCheers(contributors);

  const commitNodes = Array.isArray(commits) ? commits.map(normalizeCommitNode) : [];
  const latestCommitAt = commitNodes.length ? commitNodes[0].time : '';
  const issueNodes = issuesResult.data.map(normalizeIssueNode);
  const pullNodes = pullsResult.data.map(normalizePullRequestNode);

  const pureIssues = issueNodes.filter((item) => !item.isPullRequest);
  const openIssuesTotal = pureIssues.filter((item) => item.state === 'open').length;
  const awaitingReviewTotal = pullNodes.filter(
    (pr) => pr.requestedReviewers.length || pr.requestedTeams.length
  ).length;
  const allEvents = buildActivityEvents({
    commits: commitNodes,
    issues: issueNodes,
    pullRequests: pullNodes
  });

  const githubState = {
    configured: true,
    ok: true,
    repository: repo.full_name || repository,
    stars: Number(repo.stargazers_count || 0),
    contributorCount: contributorsResult.data.length,
    contributorCountTruncated: contributorsResult.truncated,
    cloneUrl: repo.clone_url || '',
    htmlUrl: repo.html_url || '',
    defaultBranch: repo.default_branch || 'main',
    pushedAt: repo.pushed_at || '',
    latestCommitAt,
    events: allEvents.slice(0, ACTIVITY_FEED_LIMIT),
    commits: commitNodes,
    issues: pureIssues.slice(0, ISSUES_DISPLAY_LIMIT),
    pullRequests: pullNodes.slice(0, PULLS_DISPLAY_LIMIT),
    issuesTotal: pureIssues.length,
    openIssuesTotal,
    pullRequestsTotal: pullNodes.length,
    awaitingReviewTotal,
    issuesTotalTruncated: issuesResult.truncated,
    pullRequestsTotalTruncated: pullsResult.truncated,
    issuesWarning: [
      issuesResult.warning,
      issuesResult.truncated ? `Issue 数据超过 ${ISSUES_FETCH_LIMIT} 条，仅展示前 ${ISSUES_FETCH_LIMIT} 条` : ''
    ]
      .filter(Boolean)
      .join('；'),
    pullsWarning: [
      pullsResult.warning,
      pullsResult.truncated ? `PR 数据超过 ${PULLS_FETCH_LIMIT} 条，仅展示前 ${PULLS_FETCH_LIMIT} 条` : ''
    ]
      .filter(Boolean)
      .join('；'),
    message: `已同步 GitHub 仓库 ${repo.full_name || repository}`
  };

  return {
    ok,
    generatedAt: new Date().toISOString(),
    fingerprint,
    count: contributors.length,
    contributors,
    previewContributors: normalized,
    cheersTotal,
    recentCheers,
    github: githubState,
    errors,
    warnings,
    message: ok
      ? `已加载 ${normalized.length} 位贡献者，累计 ${cheersTotal} 条寄语`
      : '数据校验失败，页面暂时保留上一次有效结果'
  };
}

function cacheRequestFor(repository) {
  return new Request(`https://pulse-wall-cache.internal/__v1/${encodeURIComponent(repository)}`, {
    method: 'GET'
  });
}

async function readCachedBundle(repository) {
  let edgeBundle = null;
  if (edgeCache) {
    try {
      const match = await edgeCache.match(cacheRequestFor(repository));
      if (match) {
        const parsed = await match.json();
        if (parsed && typeof parsed.refreshedAt === 'number' && parsed.state) {
          edgeBundle = { repository, refreshedAt: parsed.refreshedAt, state: parsed.state };
        }
      }
    } catch {
      edgeBundle = null;
    }
  }

  const localBundle = memoryBundle && memoryBundle.repository === repository ? memoryBundle : null;
  let best = null;
  if (edgeBundle && localBundle) {
    best = edgeBundle.refreshedAt >= localBundle.refreshedAt ? edgeBundle : localBundle;
  } else {
    best = edgeBundle || localBundle;
  }

  if (best) {
    memoryBundle = best;
  }
  return best;
}

async function writeCachedBundle(repository, bundle) {
  memoryBundle = { repository, refreshedAt: bundle.refreshedAt, state: bundle.state };

  if (edgeCache) {
    const response = new Response(
      JSON.stringify({ refreshedAt: bundle.refreshedAt, state: bundle.state }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        }
      }
    );
    await edgeCache.put(cacheRequestFor(repository), response);
  }
}

async function refreshOnce(repository, token) {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const state = await fetchPackedWallState({ repository, token });
    const bundle = { refreshedAt: Date.now(), state };
    await writeCachedBundle(repository, bundle);
    return bundle;
  })();

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

function enrichState(state, { refreshedAt, cooldownMs, retryInMs, cached, stale = false }) {
  return {
    ...state,
    refreshedAt,
    cooldownMs,
    retryInMs,
    cached,
    ...(stale ? { stale: true } : {}),
    delivery: 'cloudflare-worker'
  };
}

export default {
  async fetch(request, env = {}) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const repository = String(env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY).trim();
    const cooldownMs = Math.max(1000, Number(env.REFRESH_COOLDOWN_MS || DEFAULT_COOLDOWN_MS) || DEFAULT_COOLDOWN_MS);
    const token = String(env.GITHUB_TOKEN || '').trim();

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return jsonResponse({
        ok: true,
        service: 'open-source-pulse-wall-api',
        repository,
        cooldownMs
      });
    }

    if (request.method === 'GET' && (url.pathname === '/api/state' || url.pathname === '/api/contributors')) {
      const now = Date.now();
      const bundle = await readCachedBundle(repository);

      if (bundle && now - bundle.refreshedAt < cooldownMs) {
        const retryInMs = cooldownMs - (now - bundle.refreshedAt);
        return jsonResponse(
          enrichState(bundle.state, {
            refreshedAt: bundle.refreshedAt,
            cooldownMs,
            retryInMs,
            cached: true
          })
        );
      }

      try {
        const fresh = await refreshOnce(repository, token);
        return jsonResponse(
          enrichState(fresh.state, {
            refreshedAt: fresh.refreshedAt,
            cooldownMs,
            retryInMs: cooldownMs,
            cached: false
          })
        );
      } catch (error) {
        if (bundle) {
          return jsonResponse(
            enrichState(bundle.state, {
              refreshedAt: bundle.refreshedAt,
              cooldownMs,
              retryInMs: 0,
              cached: true,
              stale: true
            })
          );
        }
        return jsonResponse({ ok: false, message: error.message }, 502);
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/refresh') {
      const now = Date.now();
      const bundle = await readCachedBundle(repository);

      if (bundle && now - bundle.refreshedAt < cooldownMs) {
        const elapsedMs = now - bundle.refreshedAt;
        const retryInMs = cooldownMs - elapsedMs;
        const retrySeconds = Math.max(1, Math.ceil(retryInMs / 1000));
        const waitText = formatCooldownText(retrySeconds);

        return jsonResponse(
          {
            ok: false,
            rateLimited: true,
            message: `刷新限流中（3 分钟最多拉取 1 次）：已同步缓冲数据，请 ${waitText} 后再试`,
            elapsedMs,
            retryInMs,
            refreshedAt: bundle.refreshedAt,
            cooldownMs,
            state: enrichState(bundle.state, {
              refreshedAt: bundle.refreshedAt,
              cooldownMs,
              retryInMs,
              cached: true
            })
          },
          429,
          { 'Retry-After': String(retrySeconds) }
        );
      }

      try {
        const fresh = await refreshOnce(repository, token);
        return jsonResponse({
          ok: true,
          generatedAt: fresh.state.generatedAt,
          refreshedAt: fresh.refreshedAt,
          cooldownMs,
          retryInMs: cooldownMs,
          message: '已一次性打包拉取最新贡献者、Issue 与 PR 状态（限流 3 分钟/次）',
          git: {
            ok: true,
            skipped: false,
            pulled: 0,
            reason: '已从 GitHub 远端打包同步'
          },
          github: {
            ok: true,
            configured: true,
            message: fresh.state.github.message
          },
          state: enrichState(fresh.state, {
            refreshedAt: fresh.refreshedAt,
            cooldownMs,
            retryInMs: cooldownMs,
            cached: false
          })
        });
      } catch (error) {
        return jsonResponse({ ok: false, message: error.message }, 502);
      }
    }

    return jsonResponse({ ok: false, message: 'Not found' }, 404);
  }
};
