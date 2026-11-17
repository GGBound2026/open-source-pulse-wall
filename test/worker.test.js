const assert = require('node:assert/strict');
const test = require('node:test');

function jsonResponse(body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

function createGithubMockFetch(callLog) {
  return async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const parsed = new URL(url);
    callLog.push(parsed.pathname + parsed.search);

    if (parsed.pathname === '/graphql') {
      const body = init.body ? JSON.parse(String(init.body)) : {};
      const queryText = String(body.query || '');

      if (queryText.includes('defaultBranchRef')) {
        return jsonResponse({
          data: {
            repository: {
              defaultBranchRef: {
                target: {
                  f0: {
                    nodes: [
                      {
                        author: {
                          user: {
                            login: 'bob-cheerer',
                            avatarUrl: 'https://avatars.githubusercontent.com/u/2002?s=160'
                          }
                        },
                        committer: { user: { login: 'web-flow', avatarUrl: '' } }
                      },
                      {
                        author: {
                          user: {
                            login: 'alice-pr-author',
                            avatarUrl: 'https://avatars.githubusercontent.com/u/1001?s=160'
                          }
                        },
                        committer: { user: { login: 'web-flow', avatarUrl: '' } }
                      }
                    ]
                  }
                }
              }
            }
          }
        });
      }

      return jsonResponse({
        data: {
          repository: {
            object: {
              entries: [
                {
                  name: '_template.json',
                  type: 'blob',
                  object: { text: '{}' }
                },
                {
                  name: 'custom-card.json',
                  type: 'blob',
                  object: {
                    text: JSON.stringify({
                      name: 'Alice',
                      motto: 'Hello OSS',
                      cheers: []
                    })
                  }
                }
              ]
            }
          }
        }
      });
    }

    if (parsed.pathname === '/repos/acme/wall') {
      return jsonResponse({
        full_name: 'acme/wall',
        stargazers_count: 12,
        clone_url: 'https://github.com/acme/wall.git',
        html_url: 'https://github.com/acme/wall',
        default_branch: 'main',
        pushed_at: '2026-05-12T07:16:15Z'
      });
    }

    if (parsed.pathname === '/repos/acme/wall/contributors') {
      return jsonResponse([{ login: 'alice' }]);
    }

    if (parsed.pathname === '/repos/acme/wall/commits') {
      return jsonResponse([
        {
          sha: '1234567890abcdef',
          parents: [],
          commit: {
            message: 'Add alice profile',
            author: { name: 'Alice', date: '2026-05-12T07:00:00Z' },
            committer: { date: '2026-05-12T07:00:00Z' }
          },
          author: { login: 'alice', avatar_url: '', html_url: '' },
          html_url: 'https://github.com/acme/wall/commit/1234567890abcdef'
        }
      ]);
    }

    if (parsed.pathname === '/repos/acme/wall/issues') {
      return jsonResponse([
        {
          number: 1,
          title: '[Question] Open question',
          state: 'open',
          user: { login: 'alice', avatar_url: '', html_url: '' },
          html_url: 'https://github.com/acme/wall/issues/1',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-10T01:00:00Z',
          closed_at: null,
          comments: 1,
          labels: [{ name: 'question', color: 'd876e3' }]
        },
        {
          number: 2,
          title: '[Question] Closed question',
          state: 'closed',
          user: { login: 'bob', avatar_url: '', html_url: '' },
          html_url: 'https://github.com/acme/wall/issues/2',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-10T02:00:00Z',
          closed_at: '2026-05-10T02:00:00Z',
          comments: 2,
          labels: [{ name: 'question', color: 'd876e3' }]
        },
        {
          number: 3,
          title: '[Idea] Open idea',
          state: 'open',
          user: { login: 'alice', avatar_url: '', html_url: '' },
          html_url: 'https://github.com/acme/wall/issues/3',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-10T03:00:00Z',
          closed_at: null,
          comments: 3,
          labels: [{ name: 'enhancement', color: 'a2eeef' }]
        },
        {
          number: 4,
          title: '[Idea] Closed idea',
          state: 'closed',
          user: { login: 'bob', avatar_url: '', html_url: '' },
          html_url: 'https://github.com/acme/wall/issues/4',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-10T04:00:00Z',
          closed_at: '2026-05-10T04:00:00Z',
          comments: 9,
          labels: [{ name: 'enhancement', color: 'a2eeef' }]
        },
        {
          number: 5,
          title: '[Bug] Open bug',
          state: 'open',
          user: { login: 'alice', avatar_url: '', html_url: '' },
          html_url: 'https://github.com/acme/wall/issues/5',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-10T05:00:00Z',
          closed_at: null,
          comments: 1,
          labels: [{ name: 'bug', color: 'd73a4a' }]
        },
        {
          number: 6,
          title: '[Bug] Closed bug',
          state: 'closed',
          user: { login: 'bob', avatar_url: '', html_url: '' },
          html_url: 'https://github.com/acme/wall/issues/6',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-10T06:00:00Z',
          closed_at: '2026-05-10T06:00:00Z',
          comments: 4,
          labels: [{ name: 'bug', color: 'd73a4a' }]
        }
      ]);
    }

    if (parsed.pathname === '/repos/acme/wall/pulls') {
      return jsonResponse([]);
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };
}

test('worker packs state in one shot, filters closed community issues, and enforces 3-minute cooldown buffer', async () => {
  const workerModule = await import('../cloudflare/worker.mjs');
  const worker = workerModule.default;
  workerModule.resetMemoryBundleForTests();

  const originalFetch = global.fetch;
  const callLog = [];
  global.fetch = createGithubMockFetch(callLog);

  const env = {
    GITHUB_REPOSITORY: 'acme/wall',
    GITHUB_TOKEN: 'test-token',
    REFRESH_COOLDOWN_MS: '180000'
  };

  try {
    // 1. First POST /api/refresh packs GitHub data once and filters closed community issues.
    const firstRefresh = await worker.fetch(
      new Request('https://pulse-wall-api.yoryon.com/api/refresh', { method: 'POST' }),
      env
    );
    assert.equal(firstRefresh.status, 200);
    assert.equal(firstRefresh.headers.get('access-control-allow-origin'), '*');

    const firstData = await firstRefresh.json();
    assert.equal(firstData.ok, true);
    assert.equal(firstData.cooldownMs, 180000);
    assert.equal(firstData.state.count, 1);
    assert.equal(firstData.state.contributors[0].github, 'alice-pr-author');
    assert.equal(firstData.state.contributors[0].avatar, 'https://avatars.githubusercontent.com/u/1001?s=160');
    assert.equal(Object.hasOwn(firstData.state.contributors[0], 'role'), false);
    assert.equal(Object.hasOwn(firstData.state.contributors[0], 'stack'), false);
    assert.equal(Object.hasOwn(firstData.state.contributors[0], 'style'), false);
    assert.equal(Object.hasOwn(firstData.state.github, 'communityLanes'), false);

    const callsAfterFirstRefresh = callLog.length;
    assert.equal(callsAfterFirstRefresh, 7);

    // 2. Immediate second POST /api/refresh returns 429 with buffered state and 0 extra GitHub calls.
    const secondRefresh = await worker.fetch(
      new Request('https://pulse-wall-api.yoryon.com/api/refresh', { method: 'POST' }),
      env
    );
    assert.equal(secondRefresh.status, 429);
    assert.ok(Number(secondRefresh.headers.get('retry-after')) >= 1);

    const secondData = await secondRefresh.json();
    assert.equal(secondData.ok, false);
    assert.equal(secondData.rateLimited, true);
    assert.ok(secondData.retryInMs > 0);
    assert.equal(secondData.state.count, 1);
    assert.equal(callLog.length, callsAfterFirstRefresh);

    // 3. Subsequent GET /api/state within 3 minutes returns cached buffer with 0 extra GitHub calls.
    const stateResp = await worker.fetch(
      new Request('https://pulse-wall-api.yoryon.com/api/state', { method: 'GET' }),
      env
    );
    assert.equal(stateResp.status, 200);
    const stateData = await stateResp.json();
    assert.equal(stateData.cached, true);
    assert.equal(stateData.delivery, 'cloudflare-worker');
    assert.equal(stateData.count, 1);
    assert.equal(callLog.length, callsAfterFirstRefresh);
  } finally {
    workerModule.resetMemoryBundleForTests();
    global.fetch = originalFetch;
  }
});
