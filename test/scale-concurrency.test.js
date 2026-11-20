const assert = require('node:assert/strict');
const test = require('node:test');

const { processAutoMergeQueue } = require('../scripts/auto-merge-queue');
const { computeContributorScores } = require('../scripts/score-engine');

function encodeBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function makeProfileJson(name) {
  return `${JSON.stringify({ name, motto: `Hello from ${name}`, city: 'Beijing' }, null, 2)}\n`;
}

test('100-PR concurrent wave: GraphQL batching avoids REST rate limit exhaustion, in-memory tree blocks case collisions, and refreshes main once per pass', async () => {
  const graphqlNodes = [];
  const openPullMap = new Map();
  const filesByPr = {};
  const blobsBySha = {};
  const workflowsBySha = {};
  const mergedCalls = [];
  const createdComments = [];
  const dispatches = [];

  let graphqlCalls = 0;
  let restListCalls = 0;
  let restReviewsCalls = 0;
  let restChecksCalls = 0;
  let restWorkflowCalls = 0;
  let refreshMainCalls = 0;

  const addPr = ({
    number,
    login,
    filename,
    draft = false,
    labels = [],
    reviews = [],
    checkRuns = null,
    workflowRuns = null
  }) => {
    const sha = `sha${String(number).padStart(7, '0')}abcdef`;
    const blobSha = `blob-${number}`;
    const defaultChecks = [
      {
        __typename: 'CheckRun',
        databaseId: number * 10 + 1,
        name: 'pr-guard',
        status: 'COMPLETED',
        conclusion: 'SUCCESS',
        completedAt: '2026-11-20T10:00:10Z',
        detailsUrl: `https://github.com/nanzhi84/open-source-pulse-wall/runs/${number * 10 + 1}`
      },
      {
        __typename: 'CheckRun',
        databaseId: number * 10 + 2,
        name: 'validate',
        status: 'COMPLETED',
        conclusion: 'SUCCESS',
        completedAt: '2026-11-20T10:00:15Z',
        detailsUrl: `https://github.com/nanzhi84/open-source-pulse-wall/runs/${number * 10 + 2}`
      }
    ];

    graphqlNodes.push({
      number,
      state: 'OPEN',
      merged: false,
      isDraft: draft,
      createdAt: '2026-11-20T10:00:00Z',
      baseRefName: 'main',
      headRefOid: sha,
      author: { login },
      headRepository: { name: 'open-source-pulse-wall', owner: { login } },
      labels: { nodes: labels.map((name) => ({ name })) },
      reviews: { nodes: reviews.map((r) => ({ state: r.state, author: { login: r.login } })) },
      commits: {
        nodes: [
          {
            commit: {
              oid: sha,
              statusCheckRollup: {
                contexts: {
                  nodes: checkRuns || defaultChecks
                }
              }
            }
          }
        ]
      }
    });

    openPullMap.set(number, {
      number,
      state: 'open',
      merged: false,
      draft,
      mergeable: true,
      created_at: '2026-11-20T10:00:00Z',
      user: { login },
      base: { ref: 'main' },
      head: { sha, repo: { owner: { login }, name: 'open-source-pulse-wall' } },
      labels: labels.map((name) => ({ name }))
    });

    filesByPr[number] = [{ status: 'added', filename, sha: blobSha }];
    blobsBySha[blobSha] = makeProfileJson(login);
    if (workflowRuns) {
      workflowsBySha[sha] = workflowRuns;
    }
  };

  // 80 valid student profile PRs (#1..#80)
  for (let i = 1; i <= 80; i += 1) {
    const login = `student${String(i).padStart(2, '0')}`;
    addPr({ number: i, login, filename: `data/profiles/${login}.json` });
  }

  // 2 case-collision PRs for student01 and student02 (#81..#82)
  addPr({ number: 81, login: 'student01', filename: 'data/profiles/Student01.json' });
  addPr({ number: 82, login: 'student02', filename: 'data/profiles/STUDENT02.json' });

  // 5 draft PRs (#83..#87)
  for (let i = 83; i <= 87; i += 1) {
    addPr({ number: i, login: `draftuser${i}`, filename: `data/profiles/draftuser${i}.json`, draft: true });
  }

  // 5 hold-labeled PRs (#88..#92)
  for (let i = 88; i <= 92; i += 1) {
    addPr({ number: i, login: `holduser${i}`, filename: `data/profiles/holduser${i}.json`, labels: ['hold'] });
  }

  // 3 maintainer PRs (#93..#95)
  for (let i = 93; i <= 95; i += 1) {
    addPr({ number: i, login: 'nanzhi84', filename: 'README.md' });
  }

  // 3 CHANGES_REQUESTED PRs (#96..#98)
  for (let i = 96; i <= 98; i += 1) {
    addPr({
      number: i,
      login: `blocked${i}`,
      filename: `data/profiles/blocked${i}.json`,
      reviews: [{ login: 'YJLEC', state: 'CHANGES_REQUESTED' }]
    });
  }

  // 2 newly registered accounts needing maintainer approval (#99..#100)
  for (let i = 99; i <= 100; i += 1) {
    addPr({
      number: i,
      login: `newbie${i}`,
      filename: `data/profiles/newbie${i}.json`,
      checkRuns: [
        {
          __typename: 'CheckRun',
          databaseId: i * 10 + 1,
          name: 'pr-guard',
          status: 'COMPLETED',
          conclusion: 'SUCCESS',
          completedAt: '2026-11-20T10:00:10Z',
          detailsUrl: `https://github.com/nanzhi84/open-source-pulse-wall/runs/${i * 10 + 1}`
        }
      ],
      workflowRuns: [
        {
          id: i * 100,
          name: 'Validate contributors',
          event: 'pull_request',
          status: 'completed',
          conclusion: 'action_required',
          html_url: `https://github.com/nanzhi84/open-source-pulse-wall/actions/runs/${i * 100}`
        }
      ]
    });
  }

  assert.equal(graphqlNodes.length, 100);

  const github = {
    async graphql() {
      graphqlCalls += 1;
      return {
        repository: {
          pullRequests: {
            nodes: graphqlNodes,
            pageInfo: { hasNextPage: false, endCursor: null }
          }
        }
      };
    },
    async paginate(fn, params) {
      return fn(params);
    },
    rest: {
      pulls: {
        async list() {
          restListCalls += 1;
          return [];
        },
        async get({ pull_number }) {
          return { data: openPullMap.get(pull_number) };
        },
        async listReviews() {
          restReviewsCalls += 1;
          return [];
        },
        async listFiles({ pull_number }) {
          return filesByPr[pull_number] || [];
        },
        async merge({ pull_number, sha, merge_method }) {
          mergedCalls.push({ pull_number, sha, merge_method });
          const pr = openPullMap.get(pull_number);
          if (pr) {
            pr.state = 'closed';
            pr.merged = true;
          }
          return { data: { merged: true } };
        }
      },
      checks: {
        async listForRef() {
          restChecksCalls += 1;
          return { data: { check_runs: [] } };
        }
      },
      actions: {
        async listWorkflowRunsForRepo({ head_sha }) {
          restWorkflowCalls += 1;
          return { data: { workflow_runs: workflowsBySha[head_sha] || [] } };
        },
        async createWorkflowDispatch(params) {
          dispatches.push(params);
          return { status: 204 };
        }
      },
      git: {
        async getBlob({ file_sha }) {
          return { data: { content: encodeBase64(blobsBySha[file_sha] || '') } };
        }
      },
      issues: {
        async listComments() {
          return [];
        },
        async createComment({ issue_number, body }) {
          createdComments.push({ issue_number, body });
          return { data: { id: createdComments.length, body } };
        }
      }
    }
  };

  const summary = await processAutoMergeQueue({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    workspace: '/tmp/fake-100',
    nowFn: () => Date.parse('2026-11-20T10:15:00Z'),
    sleepFn: async () => {},
    refreshMainFn: () => {
      refreshMainCalls += 1;
    },
    listProfilesFn: () => ['nanzhi84.json'],
    listCheersFn: () => []
  });

  // 80 valid PRs merged serially in a single pass
  assert.equal(summary.merged.length, 80);
  assert.equal(mergedCalls.length, 80);

  // Batch GraphQL used ONCE; 0 legacy REST list/reviews/checks calls; only 2 workflow-run checks for action_required PRs
  assert.equal(graphqlCalls, 1);
  assert.equal(restListCalls, 0);
  assert.equal(restReviewsCalls, 0);
  assert.equal(restChecksCalls, 0);
  assert.equal(restWorkflowCalls, 2);

  // Only 1 git fetch at pass start (in-memory inventory handled all 80 subsequent rechecks!)
  assert.equal(refreshMainCalls, 1);

  // Case-collision PRs #81 and #82 were blocked by in-memory tree recheck
  assert.ok(createdComments.some((c) => c.issue_number === 81 && /用户名重复/.test(c.body)));
  assert.ok(createdComments.some((c) => c.issue_number === 82 && /用户名重复/.test(c.body)));

  // Newbie accounts #99 and #100 got teacher notice
  assert.ok(createdComments.some((c) => c.issue_number === 99 && /Approve and run/.test(c.body)));
  assert.ok(createdComments.some((c) => c.issue_number === 100 && /Approve and run/.test(c.body)));

  // Single pages.yml dispatch for the whole 80-PR batch
  assert.equal(summary.dispatchedPages, 1);
  assert.equal(dispatches.length, 1);
  assert.equal(dispatches[0].workflow_id, 'pages.yml');
});

test('auto-merge-queue pauses cleanly mid-pass when time budget expires and dispatches pages.yml + continuation', async () => {
  let fakeNow = Date.parse('2026-11-20T10:15:00Z');
  const openPulls = [];
  const filesByPr = {};
  const blobsBySha = {};
  const dispatches = [];
  const merged = [];

  for (let i = 1; i <= 15; i += 1) {
    const login = `user${i}`;
    const sha = `sha${String(i).padStart(7, '0')}111111`;
    openPulls.push({
      number: i,
      state: 'open',
      merged: false,
      draft: false,
      mergeable: true,
      created_at: '2026-11-20T10:00:00Z',
      user: { login },
      base: { ref: 'main' },
      head: { sha, repo: { owner: { login }, name: 'open-source-pulse-wall' } },
      labels: []
    });
    filesByPr[i] = [{ status: 'added', filename: `data/profiles/${login}.json`, sha: `blob-${i}` }];
    blobsBySha[`blob-${i}`] = makeProfileJson(login);
  }

  const github = {
    async paginate(fn, params) {
      return fn(params);
    },
    rest: {
      pulls: {
        async list() {
          return openPulls;
        },
        async get({ pull_number }) {
          return { data: openPulls.find((p) => p.number === pull_number) };
        },
        async listReviews() {
          return [];
        },
        async listFiles({ pull_number }) {
          return filesByPr[pull_number];
        },
        async merge({ pull_number }) {
          merged.push(pull_number);
          fakeNow += 300; // simulate merge taking time
          return { data: { merged: true } };
        }
      },
      checks: {
        async listForRef() {
          return {
            data: {
              check_runs: [
                { id: 1, name: 'pr-guard', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:10Z' },
                { id: 2, name: 'validate', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:15Z' }
              ]
            }
          };
        }
      },
      actions: {
        async listWorkflowRunsForRepo() {
          return { data: { workflow_runs: [] } };
        },
        async createWorkflowDispatch(params) {
          dispatches.push(params);
          return { status: 204 };
        }
      },
      git: {
        async getBlob({ file_sha }) {
          return { data: { content: encodeBase64(blobsBySha[file_sha]) } };
        }
      },
      issues: {
        async listComments() {
          return [];
        },
        async createComment() {
          return { data: { id: 1 } };
        }
      }
    }
  };

  const summary = await processAutoMergeQueue({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    workspace: '/tmp/fake-budget',
    maxLoopMs: 1000,
    nowFn: () => fakeNow,
    sleepFn: async () => {},
    refreshMainFn: () => {},
    listProfilesFn: () => [],
    listCheersFn: () => []
  });

  // Stopped early after ~4 merges instead of timing out all 15
  assert.ok(summary.merged.length >= 3 && summary.merged.length < 15);
  assert.equal(summary.dispatchedPages, 1);
  assert.equal(summary.continuedChain, true);
  assert.deepEqual(
    dispatches.map((d) => d.workflow_id),
    ['pages.yml', 'auto-merge-queue.yml']
  );
});

test('auto-merge-queue backs off cleanly on GitHub secondary rate limit without spamming merge_failed comments', async () => {
  let fakeNow = Date.parse('2026-11-20T10:15:00Z');
  const createdComments = [];
  const dispatches = [];
  const openPulls = [1, 2, 3].map((i) => ({
    number: i,
    state: 'open',
    merged: false,
    draft: false,
    mergeable: true,
    created_at: '2026-11-20T10:00:00Z',
    user: { login: `rluser${i}` },
    base: { ref: 'main' },
    head: { sha: `rlsha000${i}abcdef`, repo: { owner: { login: `rluser${i}` }, name: 'open-source-pulse-wall' } },
    labels: []
  }));

  const github = {
    async paginate(fn, params) {
      return fn(params);
    },
    rest: {
      pulls: {
        async list() {
          return openPulls;
        },
        async get({ pull_number }) {
          return { data: openPulls.find((p) => p.number === pull_number) };
        },
        async listReviews() {
          return [];
        },
        async listFiles({ pull_number }) {
          return [{ status: 'added', filename: `data/profiles/rluser${pull_number}.json`, sha: `b-${pull_number}` }];
        },
        async merge({ pull_number }) {
          if (pull_number === 2) {
            fakeNow += 5000;
            const err = new Error('You have exceeded a secondary rate limit');
            err.status = 403;
            throw err;
          }
          return { data: { merged: true } };
        }
      },
      checks: {
        async listForRef() {
          return {
            data: {
              check_runs: [
                { id: 1, name: 'pr-guard', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:10Z' },
                { id: 2, name: 'validate', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:15Z' }
              ]
            }
          };
        }
      },
      actions: {
        async listWorkflowRunsForRepo() {
          return { data: { workflow_runs: [] } };
        },
        async createWorkflowDispatch(params) {
          dispatches.push(params);
          return { status: 204 };
        }
      },
      git: {
        async getBlob({ file_sha }) {
          const num = file_sha.split('-')[1];
          return { data: { content: encodeBase64(makeProfileJson(`rluser${num}`)) } };
        }
      },
      issues: {
        async listComments() {
          return [];
        },
        async createComment(params) {
          createdComments.push(params);
          return { data: { id: 1 } };
        }
      }
    }
  };

  const summary = await processAutoMergeQueue({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    workspace: '/tmp/fake-rl',
    maxLoopMs: 1000,
    nowFn: () => fakeNow,
    sleepFn: async () => {},
    refreshMainFn: () => {},
    listProfilesFn: () => [],
    listCheersFn: () => []
  });

  assert.deepEqual(summary.merged, [1]);
  assert.equal(summary.rateLimited, true);
  assert.equal(createdComments.length, 0);
  assert.equal(summary.dispatchedPages, 1);
  assert.equal(summary.continuedChain, true);
});

test('100-user / 600-commit scoring stress test verifies exact points, tier progression, anti-abuse, and performance', () => {
  const contributors = [];
  for (let i = 1; i <= 100; i += 1) {
    const login = `stu${String(i).padStart(3, '0')}`;
    const cheers = [];
    // Each student receives 3 cheers from the next 3 students (wraps around)
    for (let offset = 1; offset <= 3; offset += 1) {
      const fromIdx = ((i + offset - 1) % 100) + 1;
      cheers.push({
        from: `stu${String(fromIdx).padStart(3, '0')}`,
        message: `Great PR #${i}!`,
        ts: '2026-11-20T10:00:00Z'
      });
    }
    contributors.push({
      name: `Student ${i}`,
      github: login,
      motto: 'Learning Git',
      city: 'Beijing',
      starred: i <= 80, // 80 starred, 20 unstarred
      joinedAt: new Date(Date.parse('2026-11-20T09:00:00Z') + i * 1000).toISOString(),
      cheers
    });
  }

  const commits = [];
  // 550 normal non-pair commits (simulating profiles + cheers)
  for (let c = 0; c < 550; c += 1) {
    commits.push({
      sha: `normal-${c}`,
      author: `stu${String((c % 100) + 1).padStart(3, '0')}`,
      fullMessage: `feat: update #${c}`,
      changedFiles: 1,
      prMerged: true
    });
  }

  // stu001 (Star=1, Cheers=3 -> 4 pts) + 3 distinct Co-authored-by pairs (+6) = 10 pts -> Tier 3!
  commits.push(
    {
      sha: 'pair-1',
      author: 'stu001',
      fullMessage: 'feat: pair 1\n\nCo-authored-by: stu010 <stu010@users.noreply.github.com>',
      changedFiles: 1,
      prMerged: true
    },
    {
      sha: 'pair-2',
      author: 'stu011',
      fullMessage: 'feat: pair 2\n\nCo-authored-by: stu001 <12345+stu001@users.noreply.github.com>',
      changedFiles: 1,
      prMerged: true
    },
    {
      sha: 'pair-3',
      author: 'stu001',
      fullMessage: 'feat: pair 3\n\nCo-authored-by: stu012 <stu012@users.noreply.github.com>',
      changedFiles: 2,
      prMerged: true
    },
    // Duplicate reverse pair (stu010 + stu001) must NOT double-count
    {
      sha: 'pair-dup',
      author: 'stu010',
      fullMessage: 'feat: dup pair\n\nCo-authored-by: stu001 <stu001@users.noreply.github.com>',
      changedFiles: 1,
      prMerged: true
    },
    // Anti-abuse: empty commit must NOT count
    {
      sha: 'pair-empty',
      author: 'stu001',
      fullMessage: 'chore: empty\n\nCo-authored-by: stu020 <stu020@users.noreply.github.com>',
      changedFiles: 0,
      prMerged: true
    },
    // Anti-abuse: >2 co-authors mass-tagging farm must NOT count
    {
      sha: 'pair-farm',
      author: 'stu002',
      fullMessage: [
        'feat: farm',
        '',
        'Co-authored-by: stu030 <stu030@users.noreply.github.com>',
        'Co-authored-by: stu031 <stu031@users.noreply.github.com>',
        'Co-authored-by: stu032 <stu032@users.noreply.github.com>'
      ].join('\n'),
      changedFiles: 1,
      prMerged: true
    },
    // stu003 (Star=1, Cheers=3 -> 4 pts) + 1 pair (+2) = 6 pts -> Tier 2!
    {
      sha: 'pair-tier2',
      author: 'stu003',
      fullMessage: 'feat: tier2\n\nCo-authored-by: stu040 <stu040@users.noreply.github.com>',
      changedFiles: 1,
      prMerged: true
    }
  );

  const t0 = performance.now();
  const { contributors: scored } = computeContributorScores({ contributors, commits });
  const elapsedMs = performance.now() - t0;

  assert.equal(scored.length, 100);
  assert.ok(elapsedMs < 250, `Expected 100-user scoring < 250ms, got ${elapsedMs.toFixed(1)}ms`);

  const byHandle = new Map(scored.map((c) => [c.github, c]));

  // stu001: 1 (Star) + 3 (Cheers) + 6 (3 pairs) = 10 -> Tier 3, Rank 1, Top 5
  assert.equal(byHandle.get('stu001').score.points, 10);
  assert.equal(byHandle.get('stu001').score.vfxTier, 3);
  assert.equal(byHandle.get('stu001').score.tierId, 'tier-3');
  assert.equal(byHandle.get('stu001').score.rank, 1);
  assert.equal(byHandle.get('stu001').score.isTop5, true);

  // stu003: 1 + 3 + 2 = 6 -> Tier 2
  assert.equal(byHandle.get('stu003').score.points, 6);
  assert.equal(byHandle.get('stu003').score.vfxTier, 2);
  assert.equal(byHandle.get('stu003').score.tierId, 'tier-2');

  // stu002: farming blocked -> 1 + 3 + 0 = 4 -> Tier 1
  assert.equal(byHandle.get('stu002').score.points, 4);
  assert.equal(byHandle.get('stu002').score.vfxTier, 1);
  assert.equal(byHandle.get('stu002').score.tierId, 'tier-1');

  // stu081 (unstarred): 0 + 3 + 0 = 3 pts, but Star hard gate keeps it locked (vfxTier 0, not Top 5)
  assert.equal(byHandle.get('stu081').score.points, 3);
  assert.equal(byHandle.get('stu081').score.vfxTier, 0);
  assert.equal(byHandle.get('stu081').score.tierId, 'locked');
  assert.equal(byHandle.get('stu081').score.isTop5, false);

  // Exactly 5 Top 5 slots
  assert.equal(scored.filter((c) => c.score.isTop5).length, 5);
});
