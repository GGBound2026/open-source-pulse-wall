const assert = require('node:assert/strict');
const test = require('node:test');

const scoreEngine = require('../scripts/score-engine');

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
                        committedDate: '2026-05-12T06:00:00Z',
                        author: {
                          user: {
                            login: 'nanzhi84',
                            avatarUrl: 'https://avatars.githubusercontent.com/u/999?s=160'
                          }
                        },
                        committer: { user: { login: 'web-flow', avatarUrl: '' } },
                        associatedPullRequests: { nodes: [] }
                      },
                      {
                        committedDate: '2026-05-10T08:00:00Z',
                        author: { user: null },
                        committer: { user: { login: 'web-flow', avatarUrl: '' } },
                        associatedPullRequests: {
                          nodes: [
                            {
                              author: {
                                login: 'alice-pr-author',
                                avatarUrl: 'https://avatars.githubusercontent.com/u/1001?s=160'
                              }
                            }
                          ]
                        }
                      }
                    ]
                  },
                  f1: {
                    nodes: [
                      {
                        committedDate: '2026-05-12T06:30:00Z',
                        author: { user: null },
                        committer: { user: { login: 'web-flow', avatarUrl: '' } },
                        associatedPullRequests: {
                          nodes: [
                            {
                              author: {
                                login: 'bob-cheerer',
                                avatarUrl: 'https://avatars.githubusercontent.com/u/2002?s=160'
                              }
                            }
                          ]
                        }
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
            profiles: {
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
                      motto: 'Hello OSS'
                    })
                  }
                }
              ]
            },
            cheers: {
              entries: [
                {
                  name: '_template.json',
                  type: 'blob',
                  object: {}
                },
                {
                  name: 'custom-card',
                  type: 'tree',
                  object: {
                    entries: [
                      {
                        name: 'random-note.json',
                        type: 'blob',
                        object: {
                          text: JSON.stringify({
                            message: 'Awesome first PR!'
                          })
                        }
                      }
                    ]
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

    if (parsed.pathname === '/repos/acme/wall/stargazers') {
      return jsonResponse([
        { login: 'alice-pr-author' },
        { login: 'external-fan' }
      ]);
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
    assert.equal(firstData.state.contributors[0].starred, true);
    assert.equal(firstData.state.contributors[0].score.orbitId, 'sun');
    assert.equal(firstData.state.contributors[0].score.tierId, 'sun');
    assert.equal(firstData.state.contributors[0].score.vfxTier, 3);
    assert.equal(firstData.state.contributors[0].score.starredTotal, 1);
    assert.equal(firstData.state.contributors[0].score.poolSize, 0);
    assert.equal(firstData.state.contributors[0].score.nextTierPoints, null);
    assert.equal(firstData.state.contributors[0].score.promotion.progress, 100);
    assert.deepEqual(firstData.state.github.stargazers, ['alice-pr-author', 'external-fan']);
    assert.equal(firstData.state.contributors[0].avatar, 'https://avatars.githubusercontent.com/u/1001?s=160');
    assert.equal(firstData.state.contributors[0].cheers.length, 1);
    assert.equal(firstData.state.contributors[0].cheers[0].from, 'bob-cheerer');
    assert.equal(firstData.state.contributors[0].cheers[0].message, 'Awesome first PR!');
    assert.equal(firstData.state.contributors[0].cheers[0].ts, '2026-05-12T06:30:00Z');
    assert.equal(firstData.state.cheersTotal, 1);
    assert.equal(Object.hasOwn(firstData.state.contributors[0], 'role'), false);
    assert.equal(Object.hasOwn(firstData.state.contributors[0], 'stack'), false);
    assert.equal(Object.hasOwn(firstData.state.contributors[0], 'style'), false);
    assert.equal(Object.hasOwn(firstData.state.contributors[0], 'homepage'), false);
    assert.equal(Object.hasOwn(firstData.state.github, 'communityLanes'), false);

    const callsAfterFirstRefresh = callLog.length;
    assert.equal(callsAfterFirstRefresh, 8);

    // 2. Immediate second POST /api/refresh returns 200 with latest cached snapshot and 0 extra GitHub calls.
    const secondRefresh = await worker.fetch(
      new Request('https://pulse-wall-api.yoryon.com/api/refresh', { method: 'POST' }),
      env
    );
    assert.equal(secondRefresh.status, 200);

    const secondData = await secondRefresh.json();
    assert.equal(secondData.ok, true);
    assert.equal(secondData.cached, true);
    assert.equal(secondData.message, '已经帮你同步最新缓存页面，如果显示滞后请三分钟后重试');
    assert.equal(secondData.cooldownMs, 180000);
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

    // 4. Even after cooldown expires, GET /api/state serves cached snapshot with 0 GitHub calls (refresh is click-only).
    const realDateNow = Date.now;
    const backgroundTasks = [];
    try {
      Date.now = () => realDateNow() + 200000;
      const idleResp = await worker.fetch(
        new Request('https://pulse-wall-api.yoryon.com/api/state', { method: 'GET' }),
        env,
        { waitUntil(promise) { backgroundTasks.push(promise); } }
      );
      assert.equal(idleResp.status, 200);
      const idleData = await idleResp.json();
      assert.equal(idleData.cached, true);
      assert.equal(idleData.count, 1);
      assert.equal(backgroundTasks.length, 0);
      assert.equal(callLog.length, callsAfterFirstRefresh);

      // 5. Clicking POST /api/refresh after 3 minutes triggers a real GitHub fetch and resets the 3-minute window.
      const thirdRefresh = await worker.fetch(
        new Request('https://pulse-wall-api.yoryon.com/api/refresh', { method: 'POST' }),
        env
      );
      assert.equal(thirdRefresh.status, 200);
      const thirdData = await thirdRefresh.json();
      assert.equal(thirdData.ok, true);
      assert.equal(thirdData.cached, false);
      assert.equal(thirdData.cooldownMs, 180000);
      assert.equal(callLog.length, callsAfterFirstRefresh * 2);
    } finally {
      Date.now = realDateNow;
    }
  } finally {
    workerModule.resetMemoryBundleForTests();
    global.fetch = originalFetch;
  }
});

test('worker scoring, cutoffs, rank-percentile tiering, and promotion math match scripts/score-engine.js 100%', async () => {
  const workerModule = await import('../cloudflare/worker.mjs');

  assert.deepEqual(workerModule.TIER_PERCENTILE_CUTOFFS, scoreEngine.TIER_PERCENTILE_CUTOFFS);
  assert.equal(Object.hasOwn(workerModule, 'VFX_TIER_THRESHOLDS'), false);
  assert.equal(Object.hasOwn(workerModule, 'resolveVfxTier'), false);

  for (const poolSize of [0, 1, 2, 3, 4, 5, 10, 44, 75, 100]) {
    assert.deepEqual(
      workerModule.computeTierCutoffs(poolSize),
      scoreEngine.computeTierCutoffs(poolSize)
    );
  }

  for (const sample of [
    { starred: false, rank: 1, starredCount: 49 },
    { starred: true, rank: 1, starredCount: 1 },
    { starred: true, rank: 1, starredCount: 49 },
    { starred: true, rank: 4, starredCount: 49 },
    { starred: true, rank: 6, starredCount: 6 },
    { starred: true, rank: 6, starredCount: 7 },
    { starred: true, rank: 7, starredCount: 7 },
    { starred: true, rank: 6, starredCount: 8 },
    { starred: true, rank: 7, starredCount: 8 },
    { starred: true, rank: 8, starredCount: 8 },
    { starred: true, rank: 12, starredCount: 49 },
    { starred: true, rank: 13, starredCount: 49 },
    { starred: true, rank: 27, starredCount: 49 },
    { starred: true, rank: 28, starredCount: 49 }
  ]) {
    assert.deepEqual(
      workerModule.resolveRankTier(sample),
      scoreEngine.resolveRankTier(sample)
    );
  }

  const contributors = [];
  for (let i = 1; i <= 49; i += 1) {
    const cheers = [];
    if (i <= 20) cheers.push({ from: `w-${String(i + 1).padStart(2, '0')}`, message: 'cheer!' });
    contributors.push({
      name: `Worker Star ${i}`,
      github: `w-${String(i).padStart(2, '0')}`,
      starred: true,
      joinedAt: new Date(Date.parse('2026-11-10T00:00:00Z') + i * 1000).toISOString(),
      cheers
    });
  }
  for (let i = 50; i <= 64; i += 1) {
    contributors.push({
      name: `Worker Outer ${i}`,
      github: `w-${String(i).padStart(2, '0')}`,
      starred: false,
      joinedAt: new Date(Date.parse('2026-11-10T00:00:00Z') + i * 1000).toISOString(),
      cheers: [{ from: 'w-01', message: 'welcome!' }]
    });
  }

  const commits = [
    {
      sha: 'wp1',
      author: 'w-01',
      changedFiles: 2,
      prMerged: true,
      fullMessage: 'feat: p1\n\nCo-authored-by: w-50 <w-50@users.noreply.github.com>'
    },
    {
      sha: 'wp2',
      author: 'w-01',
      changedFiles: 1,
      prMerged: true,
      fullMessage: 'feat: p2\n\nCo-authored-by: w-51 <w-51@users.noreply.github.com>'
    },
    {
      sha: 'wp3',
      author: 'w-02',
      changedFiles: 1,
      prMerged: true,
      authors: [{ login: 'w-02' }, { login: 'w-52' }],
      fullMessage: 'feat: p3'
    },
    {
      sha: 'wp-empty',
      author: 'w-03',
      changedFiles: 0,
      prMerged: true,
      fullMessage: 'chore: empty\n\nCo-authored-by: w-53 <w-53@users.noreply.github.com>'
    }
  ];

  const engineResult = scoreEngine.computeContributorScores({ contributors, commits });
  const workerResult = workerModule.computeContributorScores({ contributors, commits });
  assert.deepEqual(workerResult, engineResult);

  // Also check small-N cohorts (M=0, M=1, M=2, M=3)
  for (const n of [1, 5, 6, 7, 8]) {
    const small = contributors.slice(0, n);
    assert.deepEqual(
      workerModule.computeContributorScores({ contributors: small, commits: [] }),
      scoreEngine.computeContributorScores({ contributors: small, commits: [] })
    );
  }
});
