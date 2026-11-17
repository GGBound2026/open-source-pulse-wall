#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { listProfileFiles, listCheerFiles, readAndValidateAll } = require('./validate-contributors');

const ROOT = path.resolve(__dirname, '..');
const PROFILES_DIR = path.join(ROOT, 'data', 'profiles');
const GITHUB_API_BASE = 'https://api.github.com';
const COMMIT_GRAPH_LIMIT = 40;
const ACTIVITY_FEED_LIMIT = 8;
const CONTRIBUTORS_FETCH_LIMIT = 100;
const ISSUES_FETCH_LIMIT = 100;
const PULLS_FETCH_LIMIT = 100;
const ISSUES_DISPLAY_LIMIT = 10;
const PULLS_DISPLAY_LIMIT = 10;

function buildUnconfiguredGithubState() {
  return {
    configured: false,
    ok: false,
    repository: '',
    stars: null,
    contributorCount: null,
    cloneUrl: '',
    htmlUrl: '',
    defaultBranch: '',
    pushedAt: '',
    latestCommitAt: '',
    events: [],
    commits: [],
    issues: [],
    pullRequests: [],
    issuesTotal: 0,
    openIssuesTotal: 0,
    pullRequestsTotal: 0,
    awaitingReviewTotal: 0,
    issuesWarning: '',
    pullsWarning: '',
    message:
      '未解析到 GitHub 仓库：可设置环境变量 GITHUB_REPOSITORY，在 data/github-sync.json 填写 repository，' +
      '或在 package.json 声明 repository，或在本仓库的 git remote origin 指向 github.com'
  };
}

const REPO_OWNER_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function isValidOwnerRepo(value) {
  return Boolean(value && REPO_OWNER_NAME.test(value));
}

function parseGithubRemoteUrl(raw) {
  const input = String(raw || '').trim();
  if (!input) return '';

  const githubShorthand = /^github:\s*(.+)$/i.exec(input);
  if (githubShorthand) {
    const rest = githubShorthand[1].trim().replace(/^\/+/, '');
    return isValidOwnerRepo(rest) ? rest : '';
  }

  const sshMatch = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(input);
  if (sshMatch) {
    const candidate = `${sshMatch[1]}/${sshMatch[2]}`;
    return isValidOwnerRepo(candidate) ? candidate : '';
  }

  let urlString = input;
  if (/^git\+/i.test(urlString)) {
    urlString = urlString.replace(/^git\+/i, '');
  }

  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && !host.endsWith('.github.com')) {
      return '';
    }
    const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (segments.length < 2) return '';
    let repo = segments[1];
    if (repo.endsWith('.git')) repo = repo.slice(0, -4);
    const candidate = `${segments[0]}/${repo}`;
    return isValidOwnerRepo(candidate) ? candidate : '';
  } catch {
    return '';
  }
}

function readRepositoryFromGithubSyncFile(root) {
  const syncPath = path.join(root, 'data', 'github-sync.json');
  if (!fs.existsSync(syncPath)) return '';

  try {
    const data = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
    const value = String(data.repository ?? '').trim();
    return isValidOwnerRepo(value) ? value : '';
  } catch {
    return '';
  }
}

function readRepositoryFromPackageJson(root) {
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return '';

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const repo = pkg.repository;

    if (typeof repo === 'string') {
      const fromUrl = parseGithubRemoteUrl(repo);
      if (fromUrl) return fromUrl;
      const plain = repo.trim();
      return isValidOwnerRepo(plain) ? plain : '';
    }

    if (repo && typeof repo.url === 'string') {
      return parseGithubRemoteUrl(repo.url);
    }
  } catch {
    return '';
  }

  return '';
}

function findGitConfigPath(startDir) {
  let dir = path.resolve(startDir);

  for (let i = 0; i < 40; i += 1) {
    const gitMeta = path.join(dir, '.git');

    if (fs.existsSync(gitMeta)) {
      try {
        const stat = fs.statSync(gitMeta);

        if (stat.isDirectory()) {
          return path.join(gitMeta, 'config');
        }

        const text = fs.readFileSync(gitMeta, 'utf8');
        const line = text.split(/\r?\n/).find((entry) => entry.trim().length > 0) || '';
        const match = /^gitdir:\s+(.+)$/i.exec(line.trim());

        if (match) {
          const gitDir = path.resolve(dir, match[1].trim());
          return path.join(gitDir, 'config');
        }
      } catch {
        return null;
      }

      return null;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }

    dir = parent;
  }

  return null;
}

function readRepositoryFromGitConfigFile(root) {
  const configPath = findGitConfigPath(root);

  if (!configPath || !fs.existsSync(configPath)) {
    return '';
  }

  try {
    const text = fs.readFileSync(configPath, 'utf8');
    const originBlock = /\[remote "origin"\][^\[]*/i.exec(text);

    if (!originBlock) {
      return '';
    }

    const urlLine = /^\s*url\s*=\s*(.+)$/m.exec(originBlock[0]);

    if (!urlLine) {
      return '';
    }

    return parseGithubRemoteUrl(urlLine[1].trim());
  } catch {
    return '';
  }
}

function readRepositoryFromGitOrigin(root) {
  try {
    const stdout = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return parseGithubRemoteUrl(stdout.trim());
  } catch {
    return '';
  }
}

/**
 * Resolves owner/repo on every call (reads disk + git) so a pull can update config without restarting.
 * Precedence: GITHUB_REPOSITORY env → data/github-sync.json → package.json#repository → git remote origin → .git/config.
 */
function resolveGithubRepository(root) {
  const envRepo = String(process.env.GITHUB_REPOSITORY || '').trim();
  if (envRepo) return envRepo;

  const fromFile = readRepositoryFromGithubSyncFile(root);
  if (fromFile) return fromFile;

  const fromPackage = readRepositoryFromPackageJson(root);
  if (fromPackage) return fromPackage;

  const fromGitCli = readRepositoryFromGitOrigin(root);
  if (fromGitCli) return fromGitCli;

  return readRepositoryFromGitConfigFile(root);
}

function buildGithubHeaders(token = '') {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'open-source-pulse-wall',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function assertGithubRepository(value) {
  if (!value) {
    throw new Error(
      '需要可用的 GitHub 仓库 owner/repo（例如环境变量 GITHUB_REPOSITORY、data/github-sync.json、package.json 或 git origin）'
    );
  }

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error('仓库标识必须使用 owner/repo 格式');
  }
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
      ? node.labels.map((label) => ({
          name: String(label.name || ''),
          color: String(label.color || '')
        })).filter((label) => label.name)
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
    requestedReviewers: reviewers.map((reviewer) => ({
      login: String(reviewer.login || ''),
      avatarUrl: String(reviewer.avatar_url || ''),
      profileUrl: String(reviewer.html_url || '')
    })).filter((reviewer) => reviewer.login),
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

async function fetchOptionalCollection(pathname, token, options = {}) {
  try {
    const result = await fetchGithubCollection(pathname, token, options);
    return { data: result.data, truncated: result.truncated, warning: '' };
  } catch (error) {
    return { data: [], truncated: false, warning: error.message };
  }
}

function pickEarliestGithubUser(nodes) {
  if (!Array.isArray(nodes) || !nodes.length) return null;

  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const prAuthor = nodes[i]?.associatedPullRequests?.nodes?.[0]?.author;
    if (prAuthor?.login) {
      return {
        github: String(prAuthor.login).trim(),
        avatar: String(prAuthor.avatarUrl || '').trim(),
        ts: String(nodes[i]?.committedDate || '').trim(),
        viaPr: true
      };
    }
  }

  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const user = nodes[i]?.author?.user;
    if (user?.login) {
      return {
        github: String(user.login).trim(),
        avatar: String(user.avatarUrl || '').trim(),
        ts: String(nodes[i]?.committedDate || '').trim(),
        viaPr: false
      };
    }
  }

  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const user = nodes[i]?.committer?.user;
    if (user?.login && user.login !== 'web-flow') {
      return {
        github: String(user.login).trim(),
        avatar: String(user.avatarUrl || '').trim(),
        ts: String(nodes[i]?.committedDate || '').trim(),
        viaPr: false
      };
    }
  }

  return null;
}

async function fetchFileContributorsViaGraphql(repository, repoPaths, token) {
  if (!token || !Array.isArray(repoPaths) || !repoPaths.length) return {};

  const [owner, name] = repository.split('/');
  const resolved = {};
  const chunkSize = 40;

  for (let offset = 0; offset < repoPaths.length; offset += chunkSize) {
    const chunk = repoPaths.slice(offset, offset + chunkSize);
    const fields = chunk
      .map(
        (repoPath, idx) =>
          `f${idx}: history(first: 20, path: ${JSON.stringify(repoPath)}) { nodes { committedDate author { user { login avatarUrl(size: 160) } } committer { user { login avatarUrl(size: 160) } } associatedPullRequests(first: 1) { nodes { author { login avatarUrl(size: 160) } } } } }`
      )
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

    const response = await fetch(`${GITHUB_API_BASE}/graphql`, {
      method: 'POST',
      headers: {
        ...buildGithubHeaders(token),
        'Content-Type': 'application/json'
      },
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

async function fetchGithubState({ repository, token = '' }) {
  assertGithubRepository(repository);

  const encodedRepo = repository.split('/').map(encodeURIComponent).join('/');
  const trackedPaths = token
    ? [
        ...listProfileFiles().map((file) => `data/profiles/${file}`),
        ...listCheerFiles().map((item) => item.relPath)
      ]
    : [];
  const [repo, contributorsResult, commits, fileContributors] = await Promise.all([
    fetchGithubJson(`/repos/${encodedRepo}`, token),
    fetchGithubCollection(
      `/repos/${encodedRepo}/contributors?per_page=100`,
      token,
      { maxItems: CONTRIBUTORS_FETCH_LIMIT }
    ),
    fetchGithubJson(`/repos/${encodedRepo}/commits?per_page=${COMMIT_GRAPH_LIMIT}`, token),
    fetchFileContributorsViaGraphql(repository, trackedPaths, token).catch(() => ({}))
  ]);

  const [issuesResult, pullsResult] = await Promise.all([
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

  const commitNodes = Array.isArray(commits) ? commits.map(normalizeCommitNode) : [];
  const latestCommitAt = commitNodes.length ? commitNodes[0].time : '';
  const issueNodes = issuesResult.data.map(normalizeIssueNode);
  const pullNodes = pullsResult.data.map(normalizePullRequestNode);

  const pureIssues = issueNodes.filter((item) => !item.isPullRequest);
  const openIssuesTotal = pureIssues.filter((item) => item.state === 'open').length;
  const awaitingReviewTotal = pullNodes.filter((pr) => pr.requestedReviewers.length || pr.requestedTeams.length).length;
  const allEvents = buildActivityEvents({
    commits: commitNodes,
    issues: issueNodes,
    pullRequests: pullNodes
  });

  return {
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
    fileContributors,
    issuesTotal: pureIssues.length,
    openIssuesTotal,
    pullRequestsTotal: pullNodes.length,
    awaitingReviewTotal,
    issuesTotalTruncated: issuesResult.truncated,
    pullRequestsTotalTruncated: pullsResult.truncated,
    issuesWarning: [
      issuesResult.warning,
      issuesResult.truncated ? `Issue 数据超过 ${ISSUES_FETCH_LIMIT} 条，仅展示前 ${ISSUES_FETCH_LIMIT} 条` : ''
    ].filter(Boolean).join('；'),
    pullsWarning: [
      pullsResult.warning,
      pullsResult.truncated ? `PR 数据超过 ${PULLS_FETCH_LIMIT} 条，仅展示前 ${PULLS_FETCH_LIMIT} 条` : ''
    ].filter(Boolean).join('；'),
    message: `已同步 GitHub 仓库 ${repo.full_name || repository}`
  };
}

function computeProfilesFingerprint() {
  if (!fs.existsSync(PROFILES_DIR)) return 'missing';

  const profileParts = fs.readdirSync(PROFILES_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const fullPath = path.join(PROFILES_DIR, file);
      const stat = fs.statSync(fullPath);
      return `p:${file}:${stat.size}:${stat.mtimeMs}`;
    });

  const cheerParts = listCheerFiles().map((item) => {
    const fullPath = path.join(ROOT, item.relPath);
    const stat = fs.statSync(fullPath);
    return `c:${item.relPath}:${stat.size}:${stat.mtimeMs}`;
  });

  return crypto.createHash('sha1').update([...profileParts, ...cheerParts].join('|')).digest('hex');
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
        cheers: normalizeCheers(item.cheers),
        file
      };
    })
    .filter((item) => item.name || item.github);

  return attachCheerEntries(normalized, cheerEntries, fileContributors);
}

const RECENT_CHEERS_LIMIT = 12;

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

function buildContributorState({ githubState = buildUnconfiguredGithubState(), fallbackContributors = [] } = {}) {
  const generatedAt = new Date().toISOString();
  const fingerprint = computeProfilesFingerprint();
  const result = readAndValidateAll();
  const normalized = normalizeContributors(
    result.contributors,
    githubState?.fileContributors || {},
    result.cheerEntries || []
  );
  const ok = result.errors.length === 0;
  const contributors = ok ? normalized : fallbackContributors;
  const cheersTotal = contributors.reduce((sum, profile) => sum + profile.cheers.length, 0);
  const recentCheers = collectRecentCheers(contributors);

  return {
    ok,
    generatedAt,
    fingerprint,
    count: contributors.length,
    contributors,
    previewContributors: normalized,
    cheersTotal,
    recentCheers,
    github: githubState,
    errors: result.errors,
    warnings: result.warnings,
    message: ok
      ? `已加载 ${normalized.length} 位贡献者，累计 ${cheersTotal} 条寄语`
      : '数据校验失败，页面暂时保留上一次有效结果'
  };
}

module.exports = {
  buildUnconfiguredGithubState,
  fetchGithubState,
  computeProfilesFingerprint,
  buildContributorState,
  resolveGithubRepository
};
