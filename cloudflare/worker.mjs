const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const DEFAULT_REPOSITORY = 'nanzhi84/open-source-pulse-wall';
const DEFAULT_PAGES_STATE_URL = 'https://pulse-wall.yoryon.com/contributors.json';
const DEFAULT_COOLDOWN_MS = 180000;

const COMMIT_GRAPH_LIMIT = 40;
const SCORING_COMMITS_LIMIT = 1000;
const SCORING_COMMITS_PAGE_SIZE = 100;
const ACTIVITY_FEED_LIMIT = 8;
const CONTRIBUTORS_FETCH_LIMIT = 200;
const ISSUES_FETCH_LIMIT = 300;
const PULLS_FETCH_LIMIT = 200;
const STARGAZERS_FETCH_LIMIT = 500;
const ISSUES_DISPLAY_LIMIT = 10;
const PULLS_DISPLAY_LIMIT = 10;
const RECENT_CHEERS_LIMIT = 12;

const ALLOWED_PROFILE_KEYS = new Set(['name', 'motto', 'city']);
const ALLOWED_CHEER_KEYS = new Set(['message']);
const CHEERS_MAX_PER_PROFILE = 50;
const CHEER_MESSAGE_MAX_LENGTH = 80;
const STAR_POINTS = 1;
const CHEER_POINTS_CAP = 3;
const PAIR_POINTS_PER_PARTNER = 2;
const MAX_COAUTHORS_PER_COMMIT = 2;
const TOP5_LIMIT = 5;
const TOP5_MIN_POINTS = 1;
const TIER_PERCENTILE_CUTOFFS = {
  tier3: 0.15,
  tier2: 0.5
};
const PROMOTION_TARGETS = {
  unstarred: {
    targetOrbitId: 'tier1',
    targetLabel: '星系排名轨道',
    targetHint: '点 Star 入轨',
    targetRank: null,
    ranksNeeded: null,
    thresholdPoints: 1,
    pointsToTie: 1,
    pointsToPass: 1,
    leadPoints: 0,
    progress: 0
  },
  tier2: { targetOrbitId: 'tier2', targetLabel: '二阶 · 觉醒进化', targetHint: '前 50%' },
  tier3: { targetOrbitId: 'tier3', targetLabel: '三阶 · 顶格传说', targetHint: '前 15%' },
  top5: { targetOrbitId: 'top5', targetLabel: 'TOP 2–5 内环', targetHint: '恒星近卫' },
  sun: { targetOrbitId: 'sun', targetLabel: '#1 恒星王座', targetHint: '榜首' }
};
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
let memoryFileContributors = new Map();
let inFlightRefresh = null;

/**
 * Reset module-level in-memory buffer and inflight state for deterministic unit tests.
 */
export function resetMemoryBundleForTests() {
  memoryBundle = null;
  memoryFileContributors.clear();
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

function validateCheerEntry(entry, relPath) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(entry)) {
    return {
      errors: [`${relPath}: 文件内容必须是一个 JSON 对象，例如 { "message": "加油！" }`],
      warnings
    };
  }

  const autoResolvedKeys = Object.keys(entry).filter((key) => key === 'from' || key === 'ts');
  if (autoResolvedKeys.length > 0) {
    errors.push(
      `${relPath}: 无需填写 ${autoResolvedKeys.join('、')}，系统会根据提交该文件的 PR 自动识别寄语人与时间，请仅保留 message 字段`
    );
  }

  const unknownKeys = Object.keys(entry).filter(
    (key) => key !== 'from' && key !== 'ts' && !ALLOWED_CHEER_KEYS.has(key)
  );
  if (unknownKeys.length > 0) {
    errors.push(
      `${relPath}: 包含未允许的字段 ${unknownKeys.join(', ')}（仅允许 message）`
    );
  }

  if (typeof entry.message !== 'string' || entry.message.trim().length === 0) {
    errors.push(`${relPath}: message 必须填写`);
  } else if (entry.message.trim().length > CHEER_MESSAGE_MAX_LENGTH) {
    errors.push(`${relPath}: message 过长，最多 ${CHEER_MESSAGE_MAX_LENGTH} 个字符`);
  }

  return { errors, warnings };
}

function validateProfile(profile, filename) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(profile)) {
    return { errors: [`${filename}: 文件内容必须是一个 JSON 对象`], warnings };
  }

  if (profile.cheers !== undefined) {
    errors.push(
      `${filename}: 寄语已改为独立文件，请删除 cheers 字段，并创建 data/cheers/<目标用户名小写>/<你的GitHub用户名>.json（仅需填写 { "message": "..." }）`
    );
  }

  const unknownKeys = Object.keys(profile).filter(
    (key) => key !== 'cheers' && !ALLOWED_PROFILE_KEYS.has(key)
  );
  if (unknownKeys.length > 0) {
    errors.push(
      `${filename}: 包含未允许的字段 ${unknownKeys.join(', ')}（仅允许 name、motto、city）`
    );
  }

  requiredString(profile, 'name', 'name', errors, filename, 40);
  if (typeof profile.name === 'string' && profile.name.trim() === '你的名字' && !String(filename).startsWith('_')) {
    errors.push(`${filename}: 请将 name 从模板默认值「你的名字」改成你自己的名字或昵称`);
  }

  requiredString(profile, 'motto', 'motto', errors, filename, 120);

  if (profile.city !== undefined && (typeof profile.city !== 'string' || profile.city.trim().length > 40)) {
    errors.push(`${filename}: city 必须是 40 个字符以内的字符串`);
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

const MIGRATED_CHEERS_COMMIT_TS = Date.parse('2026-11-17T16:55:21Z');
const MIGRATED_CHEER_ORIGINAL_TS = {
  'data/cheers/nanzhi84/devillord6321.json': '2026-05-10T07:49:02Z',
  'data/cheers/devillord6321/yjlec.json': '2026-05-10T08:52:05Z',
  'data/cheers/yjlec/huahai1412.json': '2026-05-10T10:00:59Z',
  'data/cheers/yanyingtong2025/yz730.json': '2026-05-10T10:05:07Z',
  'data/cheers/devillord6321/yanyingtong2025.json': '2026-05-10T10:06:16Z',
  'data/cheers/sczohc/lyifan903-creator.json': '2026-05-10T10:35:36Z',
  'data/cheers/kkkkkkdddddd/139502.json': '2026-05-10T10:36:26Z',
  'data/cheers/nanzhi84/itamannafeiyang-svg.json': '2026-05-10T10:39:44Z',
  'data/cheers/yanyingtong2025/divine-ashes.json': '2026-05-10T10:45:03Z'
};

function resolveMigratedCheerTs(relPath, rawTs) {
  const cleaned = String(rawTs || '').trim();
  const mapped = MIGRATED_CHEER_ORIGINAL_TS[String(relPath || '').trim().toLowerCase()];
  if (!mapped) return cleaned;
  if (!cleaned) return mapped;
  return Date.parse(cleaned) === MIGRATED_CHEERS_COMMIT_TS ? mapped : cleaned;
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
    const resolvedTs = resolveMigratedCheerTs(item.relPath, resolvedMeta.ts);
    const stem = String(item.file || '').replace(/\.json$/i, '').trim();
    let from = '';
    let ts = '';

    if (item.from) {
      from = String(item.from).trim();
      ts = String(item.ts || resolvedTs || '').trim();
    } else if (resolvedMeta.viaPr && resolvedMeta.github) {
      from = resolvedMeta.github;
      ts = String(item.ts || resolvedTs || '').trim();
    } else if (stem && knownHandles.has(stem.toLowerCase())) {
      from = knownHandles.get(stem.toLowerCase());
      ts = String(item.ts || resolvedTs || '').trim();
    } else if (resolvedMeta.github) {
      from = resolvedMeta.github;
      ts = String(item.ts || resolvedTs || '').trim();
    } else {
      from = stem || 'contributor';
      ts = String(item.ts || resolveMigratedCheerTs(item.relPath, '') || '').trim();
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

function extractStargazerLogins(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const logins = [];
  for (const item of items) {
    const login = String(typeof item === 'string' ? item : (item?.login || item?.user?.login || '')).trim();
    if (!login) continue;
    const key = login.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    logins.push(login);
  }
  return logins;
}

function normalizeContributors(contributors, fileContributors = {}, cheerEntries = [], stargazers = []) {
  const stargazerSet = new Set(extractStargazerLogins(stargazers).map((login) => login.toLowerCase()));
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
      const starred = Boolean(item.starred) || (Boolean(github) && stargazerSet.has(github.toLowerCase()));

      return {
        name: String(item.name || '').trim(),
        github,
        motto: String(item.motto || '').trim(),
        city: String(item.city || '').trim(),
        avatar,
        joinedAt: String(resolved.ts || item.joinedAt || '').trim(),
        starred,
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

async function fetchStargazersViaGraphql(owner, name, token, maxItems = STARGAZERS_FETCH_LIMIT) {
  if (!token) return { data: [], truncated: false, warning: '' };

  const query = `
    query FetchStargazers($owner: String!, $name: String!, $after: String) {
      repository(owner: $owner, name: $name) {
        stargazers(first: 100, after: $after) {
          nodes {
            login
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const logins = [];
  let cursor = null;
  let truncated = false;

  while (logins.length < maxItems) {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: buildGithubHeaders(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query, variables: { owner, name, after: cursor } })
    });

    if (!response.ok) {
      const body = await response.text();
      return { data: [], truncated: false, warning: `GitHub GraphQL ${response.status}: ${body.slice(0, 240)}` };
    }

    const payload = await response.json();
    if (Array.isArray(payload.errors) && payload.errors.length) {
      return { data: [], truncated: false, warning: `GitHub GraphQL error: ${payload.errors[0].message || 'unknown error'}` };
    }

    const conn = payload?.data?.repository?.stargazers;
    const nodes = Array.isArray(conn?.nodes) ? conn.nodes : [];
    for (const node of nodes) {
      if (node?.login) logins.push(node.login);
    }

    const hasNext = Boolean(conn?.pageInfo?.hasNextPage && conn?.pageInfo?.endCursor);
    if (!hasNext) break;
    if (logins.length >= maxItems) {
      truncated = true;
      break;
    }
    cursor = conn.pageInfo.endCursor;
  }

  return { data: logins.slice(0, maxItems), truncated, warning: '' };
}

async function fetchStargazersFromPagesFallback(repository, pagesStateUrl = '') {
  const targetUrl = String(
    pagesStateUrl ||
    (repository.toLowerCase() === DEFAULT_REPOSITORY.toLowerCase() ? DEFAULT_PAGES_STATE_URL : '')
  ).trim();
  if (!targetUrl) return { data: [], truncated: false, warning: '' };

  try {
    const separator = targetUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${targetUrl}${separator}t=${Date.now()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'open-source-pulse-wall-worker',
        'Cache-Control': 'no-cache'
      }
    });
    if (!response.ok) {
      return { data: [], truncated: false, warning: `Pages fallback HTTP ${response.status}` };
    }
    const payload = await response.json();
    const payloadRepo = String(payload?.github?.repository || '').trim().toLowerCase();
    if (payloadRepo && payloadRepo !== repository.toLowerCase()) {
      return { data: [], truncated: false, warning: '' };
    }
    const logins = extractStargazerLogins(payload?.github?.stargazers || []);
    return {
      data: logins,
      truncated: Boolean(payload?.github?.stargazersTruncated),
      warning: ''
    };
  } catch (error) {
    return { data: [], truncated: false, warning: `Pages fallback: ${error.message}` };
  }
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

function normalizeGraphqlScoringCommits(nodes) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => {
    const authors = Array.isArray(node?.authors?.nodes)
      ? node.authors.nodes.map((a) => ({
          login: String(a?.user?.login || '').trim(),
          email: String(a?.email || '').trim(),
          name: String(a?.name || '').trim()
        }))
      : [];
    const prNodes = Array.isArray(node?.associatedPullRequests?.nodes)
      ? node.associatedPullRequests.nodes
      : [];
    const prMerged = prNodes.length ? prNodes.some((pr) => Boolean(pr?.merged)) : null;

    return {
      sha: String(node?.oid || ''),
      time: String(node?.committedDate || ''),
      author: authors[0]?.login || '',
      authorEmail: authors[0]?.email || '',
      authorName: authors[0]?.name || '',
      authors,
      message: String(node?.message || '').split('\n')[0],
      fullMessage: String(node?.message || ''),
      changedFiles: typeof node?.changedFilesIfAvailable === 'number' ? node.changedFilesIfAvailable : null,
      prMerged
    };
  });
}

async function fetchScoringCommitsPagesViaGraphql(owner, name, token, initialCommits = [], initialCursor = null) {
  const scoringCommits = [...initialCommits];
  let nextCursor = initialCursor;
  const pageQuery = `
    query($owner: String!, $name: String!, $after: String) {
      repository(owner: $owner, name: $name) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: ${SCORING_COMMITS_PAGE_SIZE}, after: $after) {
                nodes {
                  oid
                  committedDate
                  message
                  changedFilesIfAvailable
                  authors(first: 10) {
                    nodes {
                      user { login }
                      email
                      name
                    }
                  }
                  associatedPullRequests(first: 1) {
                    nodes {
                      number
                      merged
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      }
    }
  `;

  let firstFetch = initialCommits.length === 0 && nextCursor === null;
  while ((firstFetch || nextCursor) && scoringCommits.length < SCORING_COMMITS_LIMIT) {
    firstFetch = false;
    try {
      const pageRes = await fetch(GITHUB_GRAPHQL_URL, {
        method: 'POST',
        headers: buildGithubHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ query: pageQuery, variables: { owner, name, after: nextCursor } })
      });
      if (!pageRes.ok) break;
      const pagePayload = await pageRes.json();
      const history = pagePayload?.data?.repository?.defaultBranchRef?.target?.history;
      if (!Array.isArray(history?.nodes) || !history.nodes.length) break;
      scoringCommits.push(...normalizeGraphqlScoringCommits(history.nodes));
      nextCursor = history?.pageInfo?.hasNextPage ? history?.pageInfo?.endCursor : null;
    } catch {
      break;
    }
  }

  return scoringCommits.slice(0, SCORING_COMMITS_LIMIT);
}

async function fetchFileContributorsViaGraphql(owner, name, repoPaths, token) {
  if (!token || (!Array.isArray(repoPaths) || !repoPaths.length)) {
    return { fileContributors: {}, scoringCommits: [] };
  }

  const resolved = {};
  let scoringCommits = [];
  let scoringHistoryFetched = false;
  let scoringNextCursor = null;
  const chunkSize = 25;
  const chunks = [];
  for (let offset = 0; offset < repoPaths.length; offset += chunkSize) {
    chunks.push({ offset, paths: repoPaths.slice(offset, offset + chunkSize) });
  }

  const concurrency = 3;
  let nextIndex = 0;

  async function runChunkWorker() {
    while (nextIndex < chunks.length) {
      const { offset, paths: chunk } = chunks[nextIndex];
      nextIndex += 1;

      const fields = chunk
        .map((repoPath, idx) => {
          const depth = repoPath.startsWith('data/cheers/') ? 5 : 10;
          return `f${idx}: history(first: ${depth}, path: ${JSON.stringify(repoPath)}) { nodes { committedDate author { user { login avatarUrl(size: 160) } } committer { user { login avatarUrl(size: 160) } } associatedPullRequests(first: 1) { nodes { author { login avatarUrl(size: 160) } } } } }`;
        })
        .join('\n');

      const scoringField = offset === 0
        ? `scoringHistory: history(first: ${SCORING_COMMITS_PAGE_SIZE}) { nodes { oid committedDate message changedFilesIfAvailable authors(first: 10) { nodes { user { login } email name } } associatedPullRequests(first: 1) { nodes { number merged } } } pageInfo { hasNextPage endCursor } }`
        : '';

      const query = `
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            defaultBranchRef {
              target {
                ... on Commit {
                  ${scoringField}
                  ${fields}
                }
              }
            }
          }
        }
      `;

      try {
        const response = await fetch(GITHUB_GRAPHQL_URL, {
          method: 'POST',
          headers: buildGithubHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ query, variables: { owner, name } })
        });

        if (!response.ok) continue;
        const payload = await response.json();
        const target = payload?.data?.repository?.defaultBranchRef?.target;
        if (!target) continue;

        if (offset === 0 && target.scoringHistory?.nodes) {
          scoringHistoryFetched = true;
          scoringCommits = normalizeGraphqlScoringCommits(target.scoringHistory.nodes);
          scoringNextCursor = target.scoringHistory?.pageInfo?.hasNextPage
            ? target.scoringHistory?.pageInfo?.endCursor
            : null;
        }

        for (let idx = 0; idx < chunk.length; idx += 1) {
          const repoPath = chunk[idx];
          const nodes = target[`f${idx}`]?.nodes;
          const picked = pickEarliestGithubUser(nodes);
          if (picked) {
            resolved[repoPath] = picked;
            if (repoPath.startsWith('data/profiles/')) {
              resolved[repoPath.slice('data/profiles/'.length)] = picked;
            }
          }
        }
      } catch {
        // Continue remaining chunks so one transient GraphQL error doesn't drop all metadata.
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, chunks.length) }, () => runChunkWorker())
  );

  if (scoringHistoryFetched) {
    if (scoringNextCursor && scoringCommits.length < SCORING_COMMITS_LIMIT) {
      scoringCommits = await fetchScoringCommitsPagesViaGraphql(
        owner,
        name,
        token,
        scoringCommits,
        scoringNextCursor
      );
    }
  } else if (chunks.length > 0 && !Object.keys(resolved).length) {
    // Only fall back to a dedicated scoring query if chunk 0 failed completely.
    scoringCommits = await fetchScoringCommitsPagesViaGraphql(owner, name, token, [], null);
  }

  return { fileContributors: resolved, scoringCommits };
}

function extractGithubLoginFromEmail(email) {
  const raw = String(email || '').trim().toLowerCase();
  if (!raw) return '';
  const match = /^(?:\d+\+)?([a-z0-9-]+)@users\.noreply\.github\.com$/i.exec(raw);
  return match ? match[1].toLowerCase() : '';
}

function parseCoAuthorsFromMessage(message) {
  const text = String(message || '');
  if (!text) return [];
  const entries = [];
  const regex = /^[ \t]*Co-authored-by:[ \t]*(.+?)[ \t]*<([^>]+)>[ \t]*$/gmi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    entries.push({
      name: String(match[1] || '').trim(),
      email: String(match[2] || '').trim()
    });
  }
  return entries;
}

function resolveHandleFromIdentity(identity, { handleSet, uniqueNameMap }) {
  if (!identity) return '';
  const directLogin = String(identity.login || '').trim().replace(/^@/, '').toLowerCase();
  if (directLogin && handleSet.has(directLogin)) return directLogin;

  const emailLogin = extractGithubLoginFromEmail(identity.email);
  if (emailLogin && handleSet.has(emailLogin)) return emailLogin;

  const rawName = String(identity.name || '').trim().replace(/^@/, '').toLowerCase();
  if (rawName && handleSet.has(rawName)) return rawName;
  if (rawName && uniqueNameMap.has(rawName)) return uniqueNameMap.get(rawName);

  const emailRaw = String(identity.email || '').trim().toLowerCase();
  const atIndex = emailRaw.indexOf('@');
  if (atIndex > 0) {
    const localPart = emailRaw.slice(0, atIndex);
    if (handleSet.has(localPart)) return localPart;
  }
  return '';
}

/**
 * Compute post-Top5 pool rank cutoffs for Tier 3 and Tier 2.
 * Falls back cleanly on small pools (M <= 2) so no tier is skipped and last place isn't Tier 3.
 */
export function computeTierCutoffs(poolSize) {
  const M = Math.max(0, Math.floor(Number(poolSize) || 0));
  if (M <= 1) {
    return { tier3End: 0, tier2End: 0 };
  }
  if (M === 2) {
    return { tier3End: 0, tier2End: 1 };
  }
  const tier3End = Math.max(1, Math.ceil(M * TIER_PERCENTILE_CUTOFFS.tier3));
  const tier2End = Math.max(tier3End + 1, Math.ceil(M * TIER_PERCENTILE_CUTOFFS.tier2));
  return { tier3End, tier2End };
}

/**
 * Resolve orbit and VFX tier metadata from a contributor's starred status and leaderboard rank.
 */
export function resolveRankTier({ starred = false, rank = 0, starredCount = 0 } = {}) {
  const safeRank = Math.floor(Number(rank) || 0);
  const safeStarredCount = Math.max(0, Math.floor(Number(starredCount) || 0));
  const poolSize = Math.max(0, safeStarredCount - TOP5_LIMIT);

  if (!starred || safeRank <= 0 || safeStarredCount <= 0) {
    return {
      vfxTier: 0,
      orbitId: 'outer',
      tierId: 'locked',
      tierLabel: '未点 Star',
      tierShort: '',
      poolRank: null,
      poolSize,
      poolPercentile: null,
      rankPercentile: null
    };
  }

  const rankPercentile = Math.round((safeRank / safeStarredCount) * 1000) / 10;

  if (safeRank === 1) {
    return {
      vfxTier: 3,
      orbitId: 'sun',
      tierId: 'sun',
      tierLabel: '恒星王座',
      tierShort: '王座',
      poolRank: null,
      poolSize,
      poolPercentile: null,
      rankPercentile
    };
  }

  if (safeRank >= 2 && safeRank <= TOP5_LIMIT) {
    return {
      vfxTier: 3,
      orbitId: 'top5',
      tierId: 'top-5',
      tierLabel: '恒星近卫',
      tierShort: '近卫',
      poolRank: null,
      poolSize,
      poolPercentile: null,
      rankPercentile
    };
  }

  const { tier3End, tier2End } = computeTierCutoffs(poolSize);
  const poolRank = safeRank - TOP5_LIMIT;
  const poolPercentile = poolSize > 0 ? Math.round((poolRank / poolSize) * 1000) / 10 : null;

  if (poolRank <= tier3End) {
    return {
      vfxTier: 3,
      orbitId: 'tier3',
      tierId: 'tier-3',
      tierLabel: '三阶 · 顶格传说',
      tierShort: '三阶',
      poolRank,
      poolSize,
      poolPercentile,
      rankPercentile
    };
  }

  if (poolRank <= tier2End) {
    return {
      vfxTier: 2,
      orbitId: 'tier2',
      tierId: 'tier-2',
      tierLabel: '二阶 · 觉醒进化',
      tierShort: '二阶',
      poolRank,
      poolSize,
      poolPercentile,
      rankPercentile
    };
  }

  return {
    vfxTier: 1,
    orbitId: 'tier1',
    tierId: 'tier-1',
    tierLabel: '一阶 · 初醒破框',
    tierShort: '一阶',
    poolRank,
    poolSize,
    poolPercentile,
    rankPercentile
  };
}

/**
 * Compute next-orbit promotion targets, rank/point gaps, and smooth tier progress [0..100].
 */
function computePromotion({ starred, rank, points, orbitId, starredCount, cutoffs, rankedStarred }) {
  if (!starred || rank <= 0 || starredCount <= 0) {
    return { ...PROMOTION_TARGETS.unstarred };
  }

  if (orbitId === 'sun') {
    const runnerUp = rankedStarred[1];
    return {
      targetOrbitId: null,
      targetLabel: null,
      targetHint: null,
      targetRank: 1,
      ranksNeeded: 0,
      thresholdPoints: points,
      pointsToTie: 0,
      pointsToPass: 0,
      leadPoints: runnerUp ? Math.max(0, points - runnerUp.score.points) : points,
      progress: 100
    };
  }

  const { tier3End, tier2End } = cutoffs;
  const top5Edge = Math.min(TOP5_LIMIT, starredCount);
  let descriptor;

  if (orbitId === 'tier1') {
    const targetMeta = tier2End > 0 ? PROMOTION_TARGETS.tier2 : PROMOTION_TARGETS.top5;
    const targetRank = tier2End > 0 ? TOP5_LIMIT + tier2End : top5Edge;
    descriptor = {
      ...targetMeta,
      targetRank,
      tierTop: TOP5_LIMIT + tier2End + 1,
      tierBottomSlot: starredCount,
      tierBottom: starredCount
    };
  } else if (orbitId === 'tier2') {
    const targetMeta = tier3End > 0 ? PROMOTION_TARGETS.tier3 : PROMOTION_TARGETS.top5;
    const targetRank = tier3End > 0 ? TOP5_LIMIT + tier3End : top5Edge;
    descriptor = {
      ...targetMeta,
      targetRank,
      tierTop: TOP5_LIMIT + tier3End + 1,
      tierBottomSlot: TOP5_LIMIT + tier2End,
      tierBottom: TOP5_LIMIT + tier2End + 1
    };
  } else if (orbitId === 'tier3') {
    descriptor = {
      ...PROMOTION_TARGETS.top5,
      targetRank: TOP5_LIMIT,
      tierTop: TOP5_LIMIT + 1,
      tierBottomSlot: TOP5_LIMIT + tier3End,
      tierBottom: TOP5_LIMIT + tier3End + 1
    };
  } else {
    descriptor = {
      ...PROMOTION_TARGETS.sun,
      targetRank: 1,
      tierTop: 2,
      tierBottomSlot: top5Edge,
      tierBottom: top5Edge + 1
    };
  }

  const gatekeeper = rankedStarred[descriptor.targetRank - 1];
  const thresholdPoints = gatekeeper ? gatekeeper.score.points : points;
  const ranksNeeded = Math.max(1, rank - descriptor.targetRank);
  const pointsToTie = Math.max(0, thresholdPoints - points);
  const pointsToPass = Math.max(1, thresholdPoints - points + 1);
  const singleSlotTier = descriptor.tierTop >= descriptor.tierBottomSlot;
  const span = Math.max(1, descriptor.tierBottom - descriptor.targetRank);
  const rawPct = ((descriptor.tierBottom - rank) / span) * 100;
  const progress = singleSlotTier ? 96 : Math.min(96, Math.max(8, Math.round(rawPct)));

  return {
    targetOrbitId: descriptor.targetOrbitId,
    targetLabel: descriptor.targetLabel,
    targetHint: descriptor.targetHint,
    targetRank: descriptor.targetRank,
    ranksNeeded,
    thresholdPoints,
    pointsToTie,
    pointsToPass,
    leadPoints: 0,
    progress
  };
}

export { TIER_PERCENTILE_CUTOFFS };

export function computeContributorScores({
  contributors = [],
  commits = []
} = {}) {
  const handleSet = new Set();
  const displayHandleByKey = new Map();
  const nameCounts = new Map();
  const nameToKey = new Map();

  for (const profile of contributors) {
    const handle = String(profile.github || '').trim();
    const key = handle.toLowerCase();
    if (!key) continue;
    handleSet.add(key);
    displayHandleByKey.set(key, handle);
    const displayName = String(profile.name || '').trim().toLowerCase();
    if (displayName) {
      nameCounts.set(displayName, (nameCounts.get(displayName) || 0) + 1);
      nameToKey.set(displayName, key);
    }
  }

  const uniqueNameMap = new Map();
  for (const [nameKey, count] of nameCounts.entries()) {
    if (count === 1) uniqueNameMap.set(nameKey, nameToKey.get(nameKey));
  }

  const cheeredTargetsByUser = new Map();
  for (const targetProfile of contributors) {
    const targetKey = String(targetProfile.github || '').trim().toLowerCase();
    if (!targetKey) continue;
    const cheers = Array.isArray(targetProfile.cheers) ? targetProfile.cheers : [];
    for (const cheer of cheers) {
      const fromKey = String(cheer?.from || '').trim().toLowerCase();
      const message = String(cheer?.message || '').trim();
      if (!fromKey || !message || fromKey === targetKey) continue;
      if (!cheeredTargetsByUser.has(fromKey)) cheeredTargetsByUser.set(fromKey, new Set());
      cheeredTargetsByUser.get(fromKey).add(targetKey);
    }
  }

  const pairPartnersByUser = new Map();
  const recordPair = (aKey, bKey) => {
    if (!aKey || !bKey || aKey === bKey) return;
    if (!handleSet.has(aKey) || !handleSet.has(bKey)) return;
    if (!pairPartnersByUser.has(aKey)) pairPartnersByUser.set(aKey, new Set());
    if (!pairPartnersByUser.has(bKey)) pairPartnersByUser.set(bKey, new Set());
    pairPartnersByUser.get(aKey).add(bKey);
    pairPartnersByUser.get(bKey).add(aKey);
  };

  for (const commit of Array.isArray(commits) ? commits : []) {
    if (!commit || typeof commit !== 'object') continue;
    if (typeof commit.changedFiles === 'number' && commit.changedFiles <= 0) continue;
    if (commit.prMerged === false) continue;

    const fullMessage = String(commit.fullMessage || commit.message || '');
    const messageCoAuthors = parseCoAuthorsFromMessage(fullMessage);
    const graphAuthors = Array.isArray(commit.authors) ? commit.authors : [];

    const hasCoAuthorSignal = messageCoAuthors.length > 0 || graphAuthors.length >= 2;
    if (!hasCoAuthorSignal) continue;

    let primaryHandle = resolveHandleFromIdentity(
      { login: commit.author, email: commit.authorEmail, name: commit.authorName },
      { handleSet, uniqueNameMap }
    );
    if (!primaryHandle && graphAuthors.length > 0) {
      primaryHandle = resolveHandleFromIdentity(graphAuthors[0], { handleSet, uniqueNameMap });
    }
    if (!primaryHandle) continue;

    const coAuthors = new Set();
    for (const ga of graphAuthors) {
      const resolved = resolveHandleFromIdentity(ga, { handleSet, uniqueNameMap });
      if (resolved && resolved !== primaryHandle) coAuthors.add(resolved);
    }
    for (const ca of messageCoAuthors) {
      const resolved = resolveHandleFromIdentity(ca, { handleSet, uniqueNameMap });
      if (resolved && resolved !== primaryHandle) coAuthors.add(resolved);
    }

    if (coAuthors.size === 0 || coAuthors.size > MAX_COAUTHORS_PER_COMMIT) continue;
    for (const partner of coAuthors) {
      recordPair(primaryHandle, partner);
    }
  }

  const scored = contributors.map((profile) => {
    const key = String(profile.github || '').trim().toLowerCase();
    const starred = Boolean(profile.starred);
    const starPts = starred ? STAR_POINTS : 0;
    const cheerTargets = Array.from(cheeredTargetsByUser.get(key) || [])
      .map((t) => displayHandleByKey.get(t) || t)
      .sort((a, b) => a.localeCompare(b));
    const cheerPts = Math.min(CHEER_POINTS_CAP, cheerTargets.length);
    const pairPartners = Array.from(pairPartnersByUser.get(key) || [])
      .map((p) => displayHandleByKey.get(p) || p)
      .sort((a, b) => a.localeCompare(b));
    const pairPts = pairPartners.length * PAIR_POINTS_PER_PARTNER;
    const points = starPts + cheerPts + pairPts;

    return {
      ...profile,
      score: {
        points,
        starred,
        rank: 0,
        isTop5: false,
        breakdown: {
          star: starPts,
          cheers: cheerPts,
          cheerTargets,
          pair: pairPts,
          pairPartners
        }
      }
    };
  });

  const rankedIndices = scored
    .map((profile, idx) => ({
      idx,
      points: profile.score.points,
      starred: profile.score.starred ? 1 : 0,
      cheersSent: profile.score.breakdown.cheerTargets.length,
      cheersReceived: Array.isArray(profile.cheers) ? profile.cheers.length : 0,
      joinedTs: Date.parse(profile.joinedAt || '') || Number.POSITIVE_INFINITY,
      handle: String(profile.github || '').toLowerCase()
    }))
    .sort((a, b) => {
      if (b.starred !== a.starred) return b.starred - a.starred;
      if (b.points !== a.points) return b.points - a.points;
      if (b.cheersSent !== a.cheersSent) return b.cheersSent - a.cheersSent;
      if (b.cheersReceived !== a.cheersReceived) return b.cheersReceived - a.cheersReceived;
      if (a.joinedTs !== b.joinedTs) return a.joinedTs - b.joinedTs;
      return a.handle.localeCompare(b.handle);
    });

  const rankedStarred = [];
  rankedIndices.forEach((entry) => {
    const target = scored[entry.idx];
    if (target.score.starred) rankedStarred.push(target);
  });

  const starredCount = rankedStarred.length;
  const poolSize = Math.max(0, starredCount - TOP5_LIMIT);
  const cutoffs = computeTierCutoffs(poolSize);

  rankedIndices.forEach((entry, position) => {
    const rank = position + 1;
    const target = scored[entry.idx];
    const isTop5 = Boolean(target.score.starred) && rank <= TOP5_LIMIT && target.score.points >= TOP5_MIN_POINTS;
    const tier = resolveRankTier({
      starred: target.score.starred,
      rank,
      starredCount
    });
    const promotion = computePromotion({
      starred: target.score.starred,
      rank,
      points: target.score.points,
      orbitId: tier.orbitId,
      starredCount,
      cutoffs,
      rankedStarred
    });

    target.score = {
      ...target.score,
      ...tier,
      starredTotal: starredCount,
      nextTierPoints: null,
      rank,
      isTop5,
      promotion
    };
  });

  return { contributors: scored };
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

  const knownFileContributors = await readCachedFileContributors(repository);
  const missingPaths = trackedPaths.filter((repoPath) => !knownFileContributors[repoPath]);

  let historyBundle = { fileContributors: {}, scoringCommits: [] };
  if (token && trackedPaths.length > 0) {
    if (missingPaths.length > 0) {
      historyBundle = await fetchFileContributorsViaGraphql(owner, name, missingPaths, token).catch(
        () => ({ fileContributors: {}, scoringCommits: [] })
      );
    } else {
      const scoringCommits = await fetchScoringCommitsPagesViaGraphql(owner, name, token, [], null).catch(
        () => []
      );
      historyBundle = { fileContributors: {}, scoringCommits };
    }
  }

  const trackedSet = new Set(trackedPaths);
  const nextCachedMap = {};
  let cacheChanged = false;

  for (const repoPath of trackedPaths) {
    const entry = historyBundle.fileContributors[repoPath] || knownFileContributors[repoPath];
    if (entry && entry.github) {
      nextCachedMap[repoPath] = entry;
      if (!knownFileContributors[repoPath]) cacheChanged = true;
    }
  }

  if (!cacheChanged) {
    for (const cachedPath of Object.keys(knownFileContributors)) {
      if (!trackedSet.has(cachedPath)) {
        cacheChanged = true;
        break;
      }
    }
  }

  if (cacheChanged) {
    await writeCachedFileContributors(repository, nextCachedMap);
  }

  const fileContributors = { ...nextCachedMap };
  for (const [repoPath, entry] of Object.entries(nextCachedMap)) {
    if (repoPath.startsWith('data/profiles/')) {
      fileContributors[repoPath.slice('data/profiles/'.length)] = entry;
    }
  }

  return {
    entries,
    cheerFiles,
    fileContributors,
    scoringCommits: historyBundle.scoringCommits || []
  };
}

function validateAndNormalizeProfileEntries(profileEntries, fileContributors = {}, cheerFiles = [], stargazers = []) {
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
    if (item.target !== item.target.toLowerCase()) {
      errors.push(
        `data/cheers/${item.target}: 寄语目标目录名必须使用全小写（请改为 data/cheers/${targetKey}）`
      );
    }

    const fileStem = item.file.replace(/\.json$/i, '');
    const fileHandleProblem = validateGithubHandle(fileStem);
    if (fileHandleProblem) {
      errors.push(`${item.relPath}: 寄语文件名 "${fileStem}" 必须是合法的 GitHub 用户名（${fileHandleProblem}）`);
    }

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

    const result = validateCheerEntry(parsed, item.relPath);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    cheerEntries.push({
      target: item.target,
      file: item.file,
      relPath: item.relPath,
      message: typeof parsed?.message === 'string' ? parsed.message.trim() : ''
    });
  }

  return {
    contributors: normalizeContributors(rawContributors, fileContributors, cheerEntries, stargazers),
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
    authorEmail: String(commit?.commit?.author?.email || ''),
    authorName: String(commit?.commit?.author?.name || ''),
    avatarUrl: String(commit?.author?.avatar_url || ''),
    profileUrl: String(commit?.author?.html_url || ''),
    message: pickCommitMessageHeader(commit),
    fullMessage: String(commit?.commit?.message || ''),
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

async function fetchPackedWallState({ repository, token = '', pagesStateUrl = '' }) {
  if (!REPO_OWNER_NAME.test(repository)) {
    throw new Error('仓库标识必须使用 owner/repo 格式');
  }

  const encodedRepo = repository.split('/').map(encodeURIComponent).join('/');

  const [profilesBundle, repo, contributorsResult, commits, issuesResult, pullsResult, stargazersResult] = await Promise.all([
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
    ),
    fetchOptionalCollection(
      `/repos/${encodedRepo}/stargazers?per_page=100`,
      token,
      { maxItems: STARGAZERS_FETCH_LIMIT }
    )
  ]);

  let finalStargazersResult = stargazersResult;
  if ((!Array.isArray(finalStargazersResult.data) || !finalStargazersResult.data.length) && finalStargazersResult.warning && token) {
    const [owner, name] = repository.split('/');
    try {
      const gqlStargazers = await fetchStargazersViaGraphql(owner, name, token, STARGAZERS_FETCH_LIMIT);
      if (gqlStargazers.data.length) {
        finalStargazersResult = gqlStargazers;
      } else if (gqlStargazers.warning) {
        finalStargazersResult = {
          ...finalStargazersResult,
          warning: `${finalStargazersResult.warning} | GraphQL: ${gqlStargazers.warning}`
        };
      }
    } catch (error) {
      finalStargazersResult = {
        ...finalStargazersResult,
        warning: `${finalStargazersResult.warning} | GraphQL: ${error.message}`
      };
    }
  }

  if ((!Array.isArray(finalStargazersResult.data) || !finalStargazersResult.data.length) && finalStargazersResult.warning) {
    const pagesStargazers = await fetchStargazersFromPagesFallback(repository, pagesStateUrl);
    if (pagesStargazers.data.length) {
      finalStargazersResult = pagesStargazers;
    } else if (pagesStargazers.warning) {
      finalStargazersResult = {
        ...finalStargazersResult,
        warning: `${finalStargazersResult.warning} | ${pagesStargazers.warning}`
      };
    }
  }

  const stargazers = extractStargazerLogins(finalStargazersResult.data);
  const profileEntries = profilesBundle.entries;
  const cheerFiles = profilesBundle.cheerFiles || [];
  const fingerprint = await computeFingerprint(profileEntries, cheerFiles);
  const { contributors: normalizedBase, errors, warnings } = validateAndNormalizeProfileEntries(
    profileEntries,
    profilesBundle.fileContributors,
    cheerFiles,
    stargazers
  );
  const commitNodes = Array.isArray(commits) ? commits.map(normalizeCommitNode) : [];
  const scoringCommits = Array.isArray(profilesBundle.scoringCommits) && profilesBundle.scoringCommits.length
    ? profilesBundle.scoringCommits
    : commitNodes;
  const { contributors: normalized } = computeContributorScores({
    contributors: normalizedBase,
    commits: scoringCommits
  });
  const ok = errors.length === 0;
  const contributors = ok ? normalized : [];
  const cheersTotal = contributors.reduce((sum, profile) => sum + profile.cheers.length, 0);

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
    stargazers,
    stargazersTruncated: finalStargazersResult.truncated,
    stargazersWarning: finalStargazersResult.warning || '',
    contributorCount: contributorsResult.data.length,
    contributorCountTruncated: contributorsResult.truncated,
    cloneUrl: repo.clone_url || '',
    htmlUrl: repo.html_url || '',
    defaultBranch: repo.default_branch || 'main',
    pushedAt: repo.pushed_at || '',
    latestCommitAt,
    events: allEvents.slice(0, ACTIVITY_FEED_LIMIT),
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
    cheersTotal,
    github: githubState,
    errors,
    warnings,
    message: ok
      ? `已加载 ${normalized.length} 位贡献者，累计 ${cheersTotal} 条寄语`
      : '数据校验失败，页面暂时保留上一次有效结果'
  };
}

function cacheRequestFor(repository) {
  return new Request(`https://pulse-wall-cache.internal/__v13/${encodeURIComponent(repository)}`, {
    method: 'GET'
  });
}

function fileContributorsCacheRequestFor(repository) {
  return new Request(`https://pulse-wall-cache.internal/__v13_fc/${encodeURIComponent(repository)}`, {
    method: 'GET'
  });
}

async function readCachedFileContributors(repository) {
  let edgeMap = null;
  if (edgeCache) {
    try {
      const match = await edgeCache.match(fileContributorsCacheRequestFor(repository));
      if (match) {
        const parsed = await match.json();
        if (parsed && isPlainObject(parsed.fileContributors)) {
          edgeMap = parsed.fileContributors;
        }
      }
    } catch {
      edgeMap = null;
    }
  }

  const localMap = memoryFileContributors.get(repository) || null;
  const merged = {
    ...(edgeMap || {}),
    ...(localMap || {})
  };
  if (Object.keys(merged).length > 0) {
    memoryFileContributors.set(repository, merged);
  }
  return merged;
}

async function writeCachedFileContributors(repository, fileContributors) {
  const snapshot = { ...fileContributors };
  memoryFileContributors.set(repository, snapshot);

  if (edgeCache) {
    try {
      const response = new Response(
        JSON.stringify({ fileContributors: snapshot }),
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=604800, s-maxage=604800'
          }
        }
      );
      await edgeCache.put(fileContributorsCacheRequestFor(repository), response);
    } catch {
      // Edge cache errors must not block refresh responses.
    }
  }
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

async function refreshOnce(repository, token, pagesStateUrl = '') {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const state = await fetchPackedWallState({ repository, token, pagesStateUrl });
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
    const pagesStateUrl = String(env.PAGES_STATE_URL || '').trim();
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

      if (bundle) {
        const remainingMs = Math.max(0, cooldownMs - (now - bundle.refreshedAt));
        return jsonResponse(
          enrichState(bundle.state, {
            refreshedAt: bundle.refreshedAt,
            cooldownMs,
            retryInMs: remainingMs,
            cached: true
          })
        );
      }

      try {
        const fresh = await refreshOnce(repository, token, pagesStateUrl);
        return jsonResponse(
          enrichState(fresh.state, {
            refreshedAt: fresh.refreshedAt,
            cooldownMs,
            retryInMs: cooldownMs,
            cached: false
          })
        );
      } catch (error) {
        return jsonResponse({ ok: false, message: error.message }, 502);
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/refresh') {
      const now = Date.now();
      const bundle = await readCachedBundle(repository);

      if (bundle && now - bundle.refreshedAt < cooldownMs) {
        const elapsedMs = now - bundle.refreshedAt;
        const retryInMs = cooldownMs - elapsedMs;

        return jsonResponse({
          ok: true,
          cached: true,
          generatedAt: bundle.state.generatedAt,
          refreshedAt: bundle.refreshedAt,
          cooldownMs,
          retryInMs,
          message: '已经帮你同步最新缓存页面，如果显示滞后请三分钟后重试',
          git: {
            ok: true,
            skipped: false,
            pulled: 0,
            reason: '已返回最新共享快照'
          },
          github: {
            ok: true,
            configured: true,
            message: bundle.state.github.message
          },
          state: enrichState(bundle.state, {
            refreshedAt: bundle.refreshedAt,
            cooldownMs,
            retryInMs,
            cached: true
          })
        });
      }

      try {
        const fresh = await refreshOnce(repository, token, pagesStateUrl);
        return jsonResponse({
          ok: true,
          cached: false,
          generatedAt: fresh.state.generatedAt,
          refreshedAt: fresh.refreshedAt,
          cooldownMs,
          retryInMs: cooldownMs,
          message: '已一次性打包拉取最新贡献者、Issue 与 PR 状态',
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
