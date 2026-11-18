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

function validateCheerEntry(entry, relPath, { targetOwner = '' } = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(entry)) {
    return {
      errors: [`${relPath}: 文件内容必须是一个 JSON 对象，例如 { "message": "加油！" }`],
      warnings
    };
  }

  if (typeof entry.message !== 'string' || entry.message.trim().length === 0) {
    errors.push(`${relPath}: message 必须填写`);
  } else if (entry.message.trim().length > CHEER_MESSAGE_MAX_LENGTH) {
    errors.push(`${relPath}: message 过长，最多 ${CHEER_MESSAGE_MAX_LENGTH} 个字符`);
  }

  if (entry.from !== undefined) {
    const fromProblem = validateGithubHandle(entry.from);
    if (fromProblem) {
      errors.push(`${relPath}: from ${fromProblem}`);
    } else {
      const owner = String(targetOwner || '').trim().toLowerCase();
      const fromHandle = String(entry.from || '').trim().toLowerCase();
      if (owner && fromHandle && fromHandle === owner) {
        errors.push(`${relPath}: 不能是 profile 主人自己给自己写寄语`);
      }
    }
  }

  if (entry.ts !== undefined) {
    if (typeof entry.ts !== 'string' || Number.isNaN(Date.parse(entry.ts))) {
      errors.push(`${relPath}: ts 必须是 ISO 时间字符串，例如 2026-05-09`);
    }
  }

  return { errors, warnings };
}

function validateProfile(profile, filename) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(profile)) {
    return { errors: [`${filename}: 文件内容必须是一个 JSON 对象`], warnings };
  }

  requiredString(profile, 'name', 'name', errors, filename, 40);
  if (typeof profile.name === 'string' && profile.name.trim() === '你的名字' && !String(filename).startsWith('_')) {
    errors.push(`${filename}: 请将 name 从模板默认值「你的名字」改成你自己的名字或昵称`);
  }

  requiredString(profile, 'motto', 'motto', errors, filename, 120);

  if (profile.city !== undefined && (typeof profile.city !== 'string' || profile.city.trim().length > 40)) {
    errors.push(`${filename}: city 必须是 40 个字符以内的字符串`);
  }

  if (profile.cheers !== undefined) {
    if (!Array.isArray(profile.cheers) || profile.cheers.length > 0) {
      errors.push(
        `${filename}: 寄语已改为独立文件，请创建 data/cheers/<目标用户名>/<任意文件名>.json（仅需填写 { "message": "..." }）`
      );
    }
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

function attachCheerEntries(profiles, cheerEntries = [], fileContributors = {}) {
  if (!Array.isArray(cheerEntries) || !cheerEntries.length) return profiles;

  const knownHandles = new Map();
  const profileByKey = new Map();

  profiles.forEach((profile) => {
    const stem = String(profile.file || '').replace(/\.json$/i, '').trim().toLowerCase();
    const handle = String(profile.github || '').trim();
    if (handle) {
      knownHandles.set(handle.toLowerCase(), handle);
      profileByKey.set(handle.toLowerCase(), profile);
    }
    if (stem) {
      if (handle && !knownHandles.has(stem)) knownHandles.set(stem, handle);
      profileByKey.set(stem, profile);
    }
  });

  const buckets = new Map();
  for (const item of cheerEntries) {
    const targetKey = String(item.target || '').trim().toLowerCase();
    const targetProfile = profileByKey.get(targetKey);
    const message = String(item.message || '').trim();
    if (!targetProfile || !message) continue;

    const resolvedMeta = fileContributors[item.relPath] || {};
    const stem = String(item.file || '').replace(/\.json$/i, '').trim();
    let from = '';
    let ts = '';

    if (item.from) {
      from = String(item.from).trim();
      ts = String(item.ts || resolvedMeta.ts || '').trim();
    } else if (resolvedMeta.viaPr && resolvedMeta.github) {
      from = resolvedMeta.github;
      ts = String(item.ts || resolvedMeta.ts || '').trim();
    } else if (stem && knownHandles.has(stem.toLowerCase())) {
      from = knownHandles.get(stem.toLowerCase());
      ts = String(item.ts || resolvedMeta.ts || '').trim();
    } else if (resolvedMeta.github) {
      from = resolvedMeta.github;
      ts = String(item.ts || resolvedMeta.ts || '').trim();
    } else {
      from = stem || 'contributor';
      ts = String(item.ts || '').trim();
    }

    if (!from) continue;
    if (from.toLowerCase() === String(targetProfile.github || '').trim().toLowerCase()) continue;

    if (!buckets.has(targetProfile)) buckets.set(targetProfile, []);
    buckets.get(targetProfile).push({
      from,
      message,
      ts,
      _orderKey: String(item.file || '')
    });
  }

  for (const [profile, entries] of buckets.entries()) {
    entries.sort((a, b) => {
      const at = Date.parse(a.ts || '') || 0;
      const bt = Date.parse(b.ts || '') || 0;
      if (at !== bt) return at - bt;
      return a._orderKey.localeCompare(b._orderKey);
    });

    const seen = new Set(profile.cheers.map((c) => `${c.from.toLowerCase()}|${c.message}`));
    for (const entry of entries) {
      const dedupeKey = `${entry.from.toLowerCase()}|${entry.message}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      profile.cheers.push({
        from: entry.from,
        message: entry.message,
        ts: entry.ts
      });
    }
  }

  return profiles;
}

function normalizeContributors(contributors, fileContributors = {}, cheerEntries = []) {
  const normalized = contributors
    .map((item) => {
      const file = String(item.file || '').trim();
      const stem = file.replace(/\.json$/i, '').trim();
      const resolved = (file && (fileContributors[`data/profiles/${file}`] || fileContributors[file])) || {};
      const github = String(resolved.github || item.github || stem).trim();
      const avatar = String(
        resolved.avatar ||
        item.avatar ||
        (/^[A-Za-z0-9-]+$/.test(github) ? `https://github.com/${encodeURIComponent(github)}.png?size=160` : '')
      ).trim();

      return {
        name: String(item.name || '').trim(),
        github,
        motto: String(item.motto || '').trim(),
        city: String(item.city || '').trim(),
        avatar,
        joinedAt: String(resolved.ts || item.joinedAt || '').trim(),
        cheers: normalizeCheers(item.cheers),
        file
      };
    })
    .filter((item) => item.name || item.github);

  return attachCheerEntries(normalized, cheerEntries, fileContributors);
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

async function computeFingerprint(profileEntries, cheerFiles = []) {
  const parts = [
    ...profileEntries.map((entry) => `p:${entry.file}:${entry.text.length}`),
    ...cheerFiles.map((entry) => `c:${entry.relPath}:${entry.text.length}`)
  ];
  const summary = parts.join('|');
  const bytes = new TextEncoder().encode(summary);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchWallEntriesViaGraphql(owner, name, token) {
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        profiles: object(expression: "HEAD:data/profiles") {
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
        cheers: object(expression: "HEAD:data/cheers") {
          ... on Tree {
            entries {
              name
              type
              object {
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

  const repoNode = payload?.data?.repository || {};
  const rawProfileEntries = repoNode.profiles?.entries || repoNode.object?.entries;
  const profileEntries = Array.isArray(rawProfileEntries)
    ? rawProfileEntries
        .filter((entry) => entry.type === 'blob' && entry.name.endsWith('.json') && !entry.name.startsWith('_'))
        .map((entry) => ({
          file: entry.name,
          text: String(entry.object?.text ?? '')
        }))
        .sort((a, b) => a.file.localeCompare(b.file))
    : [];

  const cheerFiles = [];
  const rawCheerDirs = Array.isArray(repoNode.cheers?.entries) ? repoNode.cheers.entries : [];
  for (const dirEntry of rawCheerDirs) {
    if (dirEntry.type !== 'tree' || dirEntry.name.startsWith('_')) continue;
    const target = dirEntry.name;
    const subEntries = Array.isArray(dirEntry.object?.entries) ? dirEntry.object.entries : [];
    for (const fileEntry of subEntries) {
      if (fileEntry.type !== 'blob' || !fileEntry.name.endsWith('.json') || fileEntry.name.startsWith('_')) continue;
      cheerFiles.push({
        target,
        file: fileEntry.name,
        relPath: `data/cheers/${target}/${fileEntry.name}`,
        text: String(fileEntry.object?.text ?? '')
      });
    }
  }
  cheerFiles.sort((a, b) => a.relPath.localeCompare(b.relPath));

  return { entries: profileEntries, cheerFiles };
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

function pickEarliestGithubUser(nodes) {
  if (!Array.isArray(nodes) || !nodes.length) return null;

  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    const ts = String(node?.committedDate || '').trim();

    const prAuthor = node?.associatedPullRequests?.nodes?.[0]?.author;
    if (prAuthor?.login) {
      return {
        github: String(prAuthor.login).trim(),
        avatar: String(prAuthor.avatarUrl || '').trim(),
        ts,
        viaPr: true
      };
    }

    const authorUser = node?.author?.user;
    if (authorUser?.login) {
      return {
        github: String(authorUser.login).trim(),
        avatar: String(authorUser.avatarUrl || '').trim(),
        ts,
        viaPr: false
      };
    }

    const committerUser = node?.committer?.user;
    if (committerUser?.login && committerUser.login !== 'web-flow') {
      return {
        github: String(committerUser.login).trim(),
        avatar: String(committerUser.avatarUrl || '').trim(),
        ts,
        viaPr: false
      };
    }
  }

  return null;
}

async function fetchFileContributorsViaGraphql(owner, name, repoPaths, token) {
  if (!token || !Array.isArray(repoPaths) || !repoPaths.length) return {};

  const resolved = {};
  const chunkSize = 40;

  for (let offset = 0; offset < repoPaths.length; offset += chunkSize) {
    const chunk = repoPaths.slice(offset, offset + chunkSize);
    const fields = chunk
      .map((repoPath, idx) => {
        const depth = repoPath.startsWith('data/cheers/') ? 5 : 15;
        return `f${idx}: history(first: ${depth}, path: ${JSON.stringify(repoPath)}) { nodes { committedDate author { user { login avatarUrl(size: 160) } } committer { user { login avatarUrl(size: 160) } } associatedPullRequests(first: 1) { nodes { author { login avatarUrl(size: 160) } } } } }`;
      })
      .join('\n');

    const query = `
      query($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          defaultBranchRef {
            target {
              ... on Commit {
                ${fields}
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

    if (!response.ok) break;
    const payload = await response.json();
    const target = payload?.data?.repository?.defaultBranchRef?.target;
    if (!target) break;

    chunk.forEach((repoPath, idx) => {
      const picked = pickEarliestGithubUser(target[`f${idx}`]?.nodes);
      if (picked) {
        resolved[repoPath] = picked;
        if (repoPath.startsWith('data/profiles/')) {
          resolved[repoPath.slice('data/profiles/'.length)] = picked;
        }
      }
    });
  }

  return resolved;
}

async function fetchProfilesBundle(repository, encodedRepo, token) {
  const [owner, name] = repository.split('/');
  let entries = [];
  let cheerFiles = [];
  if (token) {
    try {
      const wallData = await fetchWallEntriesViaGraphql(owner, name, token);
      entries = wallData.entries;
      cheerFiles = wallData.cheerFiles;
    } catch {
      entries = await fetchProfileEntriesViaContents(encodedRepo, token);
    }
  } else {
    entries = await fetchProfileEntriesViaContents(encodedRepo, token);
  }

  const trackedPaths = [
    ...entries.map((entry) => `data/profiles/${entry.file}`),
    ...cheerFiles.map((item) => item.relPath)
  ];
  const fileContributors = await fetchFileContributorsViaGraphql(owner, name, trackedPaths, token).catch(() => ({}));
  return { entries, cheerFiles, fileContributors };
}

function validateAndNormalizeProfileEntries(profileEntries, fileContributors = {}, cheerFiles = []) {
  const errors = [];
  const warnings = [];
  const rawContributors = [];
  const validTargets = new Set();

  for (const entry of profileEntries) {
    const stem = entry.file.replace(/\.json$/i, '').trim().toLowerCase();
    if (stem) validTargets.add(stem);

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

    rawContributors.push({ ...profile, file: entry.file });
  }

  const cheerEntries = [];
  const cheersCountByTarget = new Map();

  for (const item of cheerFiles) {
    const targetKey = item.target.trim().toLowerCase();
    if (!validTargets.has(targetKey)) {
      errors.push(`${item.relPath}: 未找到目标贡献者 "${item.target}" 对应的 data/profiles/${item.target}.json`);
    }

    const nextCount = (cheersCountByTarget.get(targetKey) || 0) + 1;
    cheersCountByTarget.set(targetKey, nextCount);
    if (nextCount === CHEERS_MAX_PER_PROFILE + 1) {
      errors.push(`data/cheers/${item.target}: 寄语最多 ${CHEERS_MAX_PER_PROFILE} 条，请删减`);
    }

    let parsed;
    try {
      parsed = JSON.parse(item.text);
    } catch (error) {
      errors.push(`${item.relPath}: JSON 解析失败，${error.message}`);
      continue;
    }

    const result = validateCheerEntry(parsed, item.relPath, { targetOwner: targetKey });
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    cheerEntries.push({
      target: item.target,
      file: item.file,
      relPath: item.relPath,
      message: typeof parsed?.message === 'string' ? parsed.message.trim() : '',
      ...(typeof parsed?.from === 'string' ? { from: parsed.from.trim() } : {}),
      ...(typeof parsed?.ts === 'string' ? { ts: parsed.ts.trim() } : {})
    });
  }

  return {
    contributors: normalizeContributors(rawContributors, fileContributors, cheerEntries),
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

  const [profilesBundle, repo, contributorsResult, commits, issuesResult, pullsResult] = await Promise.all([
    fetchProfilesBundle(repository, encodedRepo, token),
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

  const profileEntries = profilesBundle.entries;
  const cheerFiles = profilesBundle.cheerFiles || [];
  const fingerprint = await computeFingerprint(profileEntries, cheerFiles);
  const { contributors: normalized, errors, warnings } = validateAndNormalizeProfileEntries(
    profileEntries,
    profilesBundle.fileContributors,
    cheerFiles
  );
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
  return new Request(`https://pulse-wall-cache.internal/__v6/${encodeURIComponent(repository)}`, {
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

function enrichState(state, { refreshedAt, cooldownMs, retryInMs, cached, stale = false, revalidating = false }) {
  return {
    ...state,
    refreshedAt,
    cooldownMs,
    retryInMs,
    cached,
    ...(stale ? { stale: true } : {}),
    ...(revalidating ? { revalidating: true } : {}),
    delivery: 'cloudflare-worker'
  };
}

export default {
  async fetch(request, env = {}, ctx = {}) {
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

      if (bundle && ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(refreshOnce(repository, token).catch(() => {}));
        return jsonResponse(
          enrichState(bundle.state, {
            refreshedAt: bundle.refreshedAt,
            cooldownMs,
            retryInMs: 0,
            cached: true,
            stale: true,
            revalidating: true
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
