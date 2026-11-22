#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { loadEnvFile, resolveGithubToken } = require('./scripts/load-env');

loadEnvFile(__dirname);
const {
  buildUnconfiguredGithubState,
  fetchGithubState,
  computeProfilesFingerprint,
  buildContributorState,
  resolveGithubRepository
} = require('./scripts/state-builder');
const { syncLocalGitRepo } = require('./scripts/git-sync');
const { resolveStaticPath } = require('./scripts/static-path');

const PORT = Number(process.env.PORT || 3008);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const POLL_INTERVAL_MS = 700;
const GITHUB_TOKEN = resolveGithubToken();
const AUTHENTICATED_GITHUB_SYNC_INTERVAL_MS = 30000;
const UNAUTHENTICATED_GITHUB_SYNC_INTERVAL_MS = 300000;
// Authenticated sync can poll quickly; unauthenticated REST calls are limited to 60 req/h.
const GITHUB_SYNC_INTERVAL_MS = Number(
  process.env.GITHUB_SYNC_INTERVAL_MS ||
    (GITHUB_TOKEN ? AUTHENTICATED_GITHUB_SYNC_INTERVAL_MS : UNAUTHENTICATED_GITHUB_SYNC_INTERVAL_MS)
);
const MANUAL_REFRESH_COOLDOWN_MS = 5000;

const clients = new Set();
let lastGoodContributors = [];
let lastFingerprint = '';
let githubState = buildUnconfiguredGithubState();
let currentState = buildState();
let currentStateJson = JSON.stringify(currentState);
let currentStateGzip = zlib.gzipSync(Buffer.from(currentStateJson));
let lastManualRefreshAt = 0;
let inFlightRefresh = null;

function setCurrentState(nextState) {
  currentState = nextState;
  currentStateJson = JSON.stringify(currentState);
  currentStateGzip = zlib.gzipSync(Buffer.from(currentStateJson));
}

async function runFullRefresh() {
  // Step 1: pull local repo so newly-merged profiles land on disk before fingerprint poll runs.
  const gitResult = await syncLocalGitRepo({ root: ROOT });

  // Hand-off to the file-watcher path: a successful ff merge changes profile mtimes,
  // so trigger pollForChanges immediately instead of waiting up to 700ms for the next tick.
  if (gitResult.ok && !gitResult.skipped && gitResult.pulled > 0) {
    pollForChanges();
  }

  // Step 2: refresh GitHub REST metadata (commits/issues/PRs/etc.) regardless of git result.
  let githubError = null;
  try {
    await refreshGithubSync();
  } catch (error) {
    githubError = error;
  }

  return {
    git: gitResult,
    github: githubError
      ? { ok: false, message: githubError.message, configured: githubState.configured }
      : { ok: githubState.ok, message: githubState.message, configured: githubState.configured }
  };
}

async function refreshGithubSync() {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const repository = resolveGithubRepository(ROOT);

    if (!repository) {
      githubState = buildUnconfiguredGithubState();
      setCurrentState(buildState());
      broadcastRaw('state', currentStateJson);
      broadcast('pulse', {
        type: githubState.ok ? 'success' : 'error',
        message: githubState.message,
        generatedAt: currentState.generatedAt
      });
      return;
    }

    try {
      githubState = await fetchGithubState({
        repository,
        token: GITHUB_TOKEN
      });
    } catch (error) {
      githubState = {
        ...githubState,
        configured: true,
        ok: false,
        repository,
        events: [],
        commits: githubState.commits || [],
        issues: githubState.issues || [],
        pullRequests: githubState.pullRequests || [],
        message: error.message
      };
    }

    setCurrentState(buildState());
    broadcastRaw('state', currentStateJson);
    broadcast('pulse', {
      type: githubState.ok ? 'success' : 'error',
      message: githubState.message,
      generatedAt: currentState.generatedAt
    });
  })();

  try {
    await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

function buildState() {
  const state = buildContributorState({
    githubState,
    fallbackContributors: lastGoodContributors
  });

  if (state.ok) {
    lastGoodContributors = state.contributors;
  }

  return state;
}

function sendSseRaw(res, event, serializedPayload) {
  res.write(`event: ${event}\ndata: ${serializedPayload}\n\n`);
}

function broadcastRaw(event, serializedPayload) {
  if (!clients.size) return;
  const frame = `event: ${event}\ndata: ${serializedPayload}\n\n`;
  for (const res of clients) {
    res.write(frame);
  }
}

function broadcast(event, payload) {
  if (!clients.size) return;
  broadcastRaw(event, JSON.stringify(payload));
}

function isCompressible(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.html' || ext === '.css' || ext === '.js' || ext === '.mjs' || ext === '.json' || ext === '.svg';
}

function acceptsGzip(req) {
  return /\bgzip\b/i.test(String(req.headers['accept-encoding'] || ''));
}

function safeStaticPath(urlPath) {
  return resolveStaticPath(urlPath, PUBLIC_DIR);
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/contributors') {
    if (acceptsGzip(req)) {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
        'Vary': 'Accept-Encoding',
        'Cache-Control': 'no-cache'
      });
      res.end(currentStateGzip);
    } else {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Vary': 'Accept-Encoding',
        'Cache-Control': 'no-cache'
      });
      res.end(currentStateJson);
    }
    return;
  }

  if (url.pathname === '/api/refresh' && req.method === 'POST') {
    const now = Date.now();
    const sinceLast = now - lastManualRefreshAt;

    if (sinceLast < MANUAL_REFRESH_COOLDOWN_MS) {
      res.writeHead(429, {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': Math.ceil((MANUAL_REFRESH_COOLDOWN_MS - sinceLast) / 1000)
      });
      res.end(JSON.stringify({
        ok: false,
        message: '刷新太频繁，稍后再试',
        retryInMs: MANUAL_REFRESH_COOLDOWN_MS - sinceLast
      }));
      return;
    }

    lastManualRefreshAt = now;
    runFullRefresh()
      .then((result) => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          generatedAt: currentState.generatedAt,
          git: result.git,
          github: result.github
        }));
      })
      .catch((error) => {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, message: error.message }));
      });
    return;
  }

  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write('retry: 1000\n\n');
    sendSseRaw(res, 'state', currentStateJson);
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  const filePath = safeStaticPath(url.pathname);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const isVendor = url.pathname.startsWith('/vendor/');
    const etag = `W/"${stat.size}-${Math.trunc(stat.mtimeMs)}"`;
    const cacheControl = isVendor ? 'public, max-age=31536000, immutable' : 'no-cache';

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, {
        'ETag': etag,
        'Cache-Control': cacheControl
      });
      res.end();
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const headers = {
        'Content-Type': contentType(filePath),
        'ETag': etag,
        'Cache-Control': cacheControl
      };

      if (isCompressible(filePath) && data.length >= 1024 && acceptsGzip(req)) {
        zlib.gzip(data, (gzipErr, compressed) => {
          if (gzipErr) {
            res.writeHead(200, headers);
            res.end(data);
            return;
          }
          res.writeHead(200, {
            ...headers,
            'Content-Encoding': 'gzip',
            'Vary': 'Accept-Encoding'
          });
          res.end(compressed);
        });
        return;
      }

      res.writeHead(200, headers);
      res.end(data);
    });
  });
}

function pollForChanges() {
  try {
    const nextFingerprint = computeProfilesFingerprint();
    if (nextFingerprint !== lastFingerprint) {
      lastFingerprint = nextFingerprint;
      setCurrentState(buildState());
      broadcastRaw('state', currentStateJson);
      broadcast('pulse', {
        type: currentState.ok ? 'success' : 'error',
        message: currentState.message,
        generatedAt: currentState.generatedAt
      });
    }
  } catch (error) {
    const payload = {
      ok: false,
      generatedAt: new Date().toISOString(),
      count: lastGoodContributors.length,
      contributors: lastGoodContributors,
      errors: [`服务读取数据失败: ${error.message}`],
      warnings: [],
      github: githubState,
      message: '服务读取数据失败，页面暂时保留上一次有效结果'
    };
    setCurrentState(payload);
    broadcastRaw('state', currentStateJson);
  }
}

lastFingerprint = computeProfilesFingerprint();

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log('');
  console.log('Open Source Pulse Wall is running');
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`API:     http://localhost:${PORT}/api/contributors`);
  console.log('');
  console.log('Edit or add files in data/profiles or data/cheers and the page will update automatically.');
  console.log('Press Ctrl+C to stop.');
  console.log('');
});

refreshGithubSync();
setInterval(pollForChanges, POLL_INTERVAL_MS);
setInterval(refreshGithubSync, GITHUB_SYNC_INTERVAL_MS);
setInterval(() => {
  broadcast('heartbeat', { at: new Date().toISOString(), clients: clients.size });
}, 15000);
