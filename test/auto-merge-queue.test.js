const assert = require('node:assert/strict');
const test = require('node:test');

const { COMMENT_MARKER } = require('../scripts/pr-guard');
const {
  fetchPrChangedFilesAndContents,
  upsertCommentByMarker,
  processAutoMergeQueue
} = require('../scripts/auto-merge-queue');

function encodeBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function createMockGithub({
  pulls = [],
  reviewsByPr = {},
  checksBySha = {},
  workflowsBySha = {},
  filesByPr = {},
  blobsBySha = {},
  commentsByPr = {},
  mergeErrorsByPr = {}
} = {}) {
  const mergedCalls = [];
  const createdComments = [];
  const updatedComments = [];
  const dispatches = [];
  const openPullMap = new Map(pulls.map((pr) => [pr.number, { ...pr }]));
  const commentStore = new Map(
    Object.entries(commentsByPr).map(([num, list]) => [Number(num), [...list]])
  );
  let nextCommentId = 9000;

  const github = {
    async paginate(fn, params) {
      return fn(params);
    },
    rest: {
      pulls: {
        async list() {
          return Array.from(openPullMap.values()).filter((pr) => pr.state === 'open');
        },
        async get({ pull_number }) {
          return { data: openPullMap.get(pull_number) };
        },
        async listReviews({ pull_number }) {
          return reviewsByPr[pull_number] || [];
        },
        async listFiles({ pull_number }) {
          return filesByPr[pull_number] || [];
        },
        async merge({ pull_number, sha, merge_method }) {
          if (mergeErrorsByPr[pull_number]) {
            throw new Error(mergeErrorsByPr[pull_number]);
          }
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
        async listForRef({ ref }) {
          return { data: { check_runs: checksBySha[ref] || [] } };
        }
      },
      actions: {
        async listWorkflowRunsForRepo({ head_sha }) {
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
        async listComments({ issue_number }) {
          return commentStore.get(issue_number) || [];
        },
        async createComment({ issue_number, body }) {
          const entry = { id: nextCommentId++, body };
          const list = commentStore.get(issue_number) || [];
          list.push(entry);
          commentStore.set(issue_number, list);
          createdComments.push({ issue_number, body });
          return { data: entry };
        },
        async updateComment({ comment_id, body }) {
          for (const list of commentStore.values()) {
            const found = list.find((item) => item.id === comment_id);
            if (found) found.body = body;
          }
          updatedComments.push({ comment_id, body });
          return { data: { id: comment_id, body } };
        }
      }
    }
  };

  return { github, mergedCalls, createdComments, updatedComments, dispatches, openPullMap };
}

test('upsertCommentByMarker creates once then updates existing marker comment', async () => {
  const { github, createdComments, updatedComments } = createMockGithub();

  const first = await upsertCommentByMarker({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    issueNumber: 10,
    marker: COMMENT_MARKER,
    body: `${COMMENT_MARKER}\nFirst pass`
  });
  assert.equal(first.action, 'created');
  assert.equal(createdComments.length, 1);

  const second = await upsertCommentByMarker({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    issueNumber: 10,
    marker: COMMENT_MARKER,
    body: `${COMMENT_MARKER}\nUpdated pass`
  });
  assert.equal(second.action, 'updated');
  assert.equal(createdComments.length, 1);
  assert.equal(updatedComments.length, 1);
  assert.match(updatedComments[0].body, /Updated pass/);
});

test('processAutoMergeQueue merges ready PRs serially, prevents case-collision race on main, notifies teachers for new accounts, and dispatches pages.yml', async () => {
  const aliceProfile = `${JSON.stringify({ name: 'Alice', motto: 'Hello OSS', city: 'Beijing' }, null, 2)}\n`;
  const aliceUpperProfile = `${JSON.stringify({ name: 'Alice 2', motto: 'Duplicate case', city: 'Beijing' }, null, 2)}\n`;

  let mainProfiles = ['bob.json'];
  const mainCheers = [];

  const { github, mergedCalls, createdComments, dispatches } = createMockGithub({
    pulls: [
      {
        number: 101,
        state: 'open',
        merged: false,
        draft: false,
        mergeable: true,
        created_at: '2026-11-20T10:00:00Z',
        user: { login: 'alice' },
        base: { ref: 'main' },
        head: { sha: '1111111aaaaaaa', repo: { owner: { login: 'alice' }, name: 'open-source-pulse-wall' } },
        labels: []
      },
      {
        // Same author opens a second concurrent PR with different casing (Alice.json)!
        // Must be blocked after PR #101 merges and refreshes main.
        number: 102,
        state: 'open',
        merged: false,
        draft: false,
        mergeable: true,
        created_at: '2026-11-20T10:00:05Z',
        user: { login: 'alice' },
        base: { ref: 'main' },
        head: { sha: '2222222bbbbbbb', repo: { owner: { login: 'alice' }, name: 'open-source-pulse-wall' } },
        labels: []
      },
      {
        // Newly registered account blocked by action_required -> must NOT merge, must notify @nanzhi84 @YJLEC once.
        number: 103,
        state: 'open',
        merged: false,
        draft: false,
        mergeable: true,
        created_at: '2026-11-20T10:00:00Z',
        user: { login: 'newbie' },
        base: { ref: 'main' },
        head: { sha: '3333333ccccccc', repo: { owner: { login: 'newbie' }, name: 'open-source-pulse-wall' } },
        labels: []
      },
      {
        // Blocked by CHANGES_REQUESTED review -> must NOT merge.
        number: 104,
        state: 'open',
        merged: false,
        draft: false,
        mergeable: true,
        created_at: '2026-11-20T10:00:00Z',
        user: { login: 'charlie' },
        base: { ref: 'main' },
        head: { sha: '4444444ddddddd', repo: { owner: { login: 'charlie' }, name: 'open-source-pulse-wall' } },
        labels: []
      }
    ],
    reviewsByPr: {
      104: [{ user: { login: 'YJLEC' }, state: 'CHANGES_REQUESTED' }]
    },
    checksBySha: {
      '1111111aaaaaaa': [
        { id: 1, name: 'pr-guard', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:10Z' },
        { id: 2, name: 'validate', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:15Z' }
      ],
      '2222222bbbbbbb': [
        { id: 3, name: 'pr-guard', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:10Z' },
        { id: 4, name: 'validate', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:15Z' }
      ],
      '3333333ccccccc': [
        { id: 5, name: 'pr-guard', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:10Z' }
      ],
      '4444444ddddddd': [
        { id: 6, name: 'pr-guard', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:10Z' },
        { id: 7, name: 'validate', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:15Z' }
      ]
    },
    workflowsBySha: {
      '3333333ccccccc': [
        {
          id: 300,
          name: 'Validate contributors',
          event: 'pull_request',
          status: 'completed',
          conclusion: 'action_required',
          html_url: 'https://github.com/nanzhi84/open-source-pulse-wall/actions/runs/300'
        }
      ]
    },
    filesByPr: {
      101: [{ status: 'added', filename: 'data/profiles/alice.json', sha: 'blob-101' }],
      102: [{ status: 'added', filename: 'data/profiles/Alice.json', sha: 'blob-102' }]
    },
    blobsBySha: {
      'blob-101': aliceProfile,
      'blob-102': aliceUpperProfile
    }
  });

  const refreshMainFn = () => {
    if (mergedCalls.some((call) => call.pull_number === 101) && !mainProfiles.includes('alice.json')) {
      mainProfiles = [...mainProfiles, 'alice.json'];
    }
  };

  const summary = await processAutoMergeQueue({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    workspace: '/tmp/fake',
    nowFn: () => Date.parse('2026-11-20T10:11:00Z'),
    sleepFn: async () => {},
    refreshMainFn,
    listProfilesFn: () => mainProfiles,
    listCheersFn: () => mainCheers
  });

  // Only PR #101 merged; PR #102 blocked by fresh main recheck; PR #103 notified teachers; PR #104 skipped by review.
  assert.deepEqual(summary.merged, [101]);
  assert.equal(mergedCalls.length, 1);
  assert.equal(mergedCalls[0].merge_method, 'squash');

  // pages.yml was dispatched automatically after merge
  assert.equal(summary.dispatchedPages, 1);
  assert.equal(dispatches.length, 1);
  assert.equal(dispatches[0].workflow_id, 'pages.yml');

  // PR #102 got a recheck failure comment; PR #103 got a maintainer alert tagging @nanzhi84 @YJLEC
  const pr102Comment = createdComments.find((c) => c.issue_number === 102);
  assert.ok(pr102Comment);
  assert.match(pr102Comment.body, /自动合并前复检未通过/);
  assert.match(pr102Comment.body, /用户名重复（不区分大小写）/);

  const pr103Comment = createdComments.find((c) => c.issue_number === 103);
  assert.ok(pr103Comment);
  assert.match(pr103Comment.body, /@nanzhi84 @YJLEC/);
  assert.match(pr103Comment.body, /Approve and run/);

  // Re-running the queue must NOT post duplicate comments for #102 or #103!
  const beforeCount = createdComments.length;
  await processAutoMergeQueue({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    workspace: '/tmp/fake',
    nowFn: () => Date.parse('2026-11-20T10:12:00Z'),
    sleepFn: async () => {},
    refreshMainFn,
    listProfilesFn: () => mainProfiles,
    listCheersFn: () => mainCheers
  });
  assert.equal(createdComments.length, beforeCount);
});

test('processAutoMergeQueue chains continuation safely when loop budget expires with waiting PRs', async () => {
  let fakeNow = Date.parse('2026-11-20T10:01:00Z');
  const { github, dispatches } = createMockGithub({
    pulls: [
      {
        number: 201,
        state: 'open',
        merged: false,
        draft: false,
        created_at: '2026-11-20T10:00:00Z',
        user: { login: 'student' },
        base: { ref: 'main' },
        head: { sha: '5555555eeeeeee', repo: { owner: { login: 'student' }, name: 'open-source-pulse-wall' } },
        labels: []
      }
    ],
    checksBySha: {
      '5555555eeeeeee': [
        { id: 1, name: 'pr-guard', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:10Z' },
        { id: 2, name: 'validate', status: 'completed', conclusion: 'success', completed_at: '2026-11-20T10:00:15Z' }
      ]
    }
  });

  const summary = await processAutoMergeQueue({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    workspace: '/tmp/fake',
    chainDepth: 2,
    maxLoopMs: 1000,
    nowFn: () => {
      const current = fakeNow;
      fakeNow += 2000;
      return current;
    },
    sleepFn: async () => {},
    refreshMainFn: () => {},
    listProfilesFn: () => [],
    listCheersFn: () => []
  });

  assert.equal(summary.continuedChain, true);
  assert.equal(dispatches.length, 1);
  assert.equal(dispatches[0].workflow_id, 'auto-merge-queue.yml');
  assert.deepEqual(dispatches[0].inputs, { chain_depth: '3' });
});

test('fetchPrChangedFilesAndContents reads blobs from base repo first (avoiding cross-fork 403) and falls back to raw_url', async () => {
  const blobRequests = [];
  const sampleJson = `${JSON.stringify({ name: 'ForkUser', motto: 'Hi' }, null, 2)}\n`;
  const github = {
    async paginate(fn, params) {
      return fn(params);
    },
    rest: {
      pulls: {
        async listFiles() {
          return [
            {
              status: 'added',
              filename: 'data/profiles/forkuser.json',
              sha: 'blob-fork-1',
              raw_url: 'https://github.com/nanzhi84/open-source-pulse-wall/raw/abc/data/profiles/forkuser.json'
            },
            {
              status: 'added',
              filename: 'data/cheers/bob/forkuser.json',
              sha: 'blob-missing',
              raw_url: 'https://github.com/nanzhi84/open-source-pulse-wall/raw/abc/data/cheers/bob/forkuser.json'
            }
          ];
        }
      },
      git: {
        async getBlob({ owner, repo, file_sha }) {
          blobRequests.push({ owner, repo, file_sha });
          if (owner !== 'nanzhi84') {
            throw new Error('403 Resource not accessible by integration');
          }
          if (file_sha === 'blob-fork-1') {
            return { data: { content: encodeBase64(sampleJson) } };
          }
          throw new Error('404 Not Found');
        }
      },
      repos: {
        async getContent() {
          throw new Error('404 Not Found');
        }
      }
    }
  };

  const cheerJson = `${JSON.stringify({ message: 'Great!' }, null, 2)}\n`;
  const { fileContents } = await fetchPrChangedFilesAndContents({
    github,
    owner: 'nanzhi84',
    repo: 'open-source-pulse-wall',
    pr: {
      number: 99,
      head: {
        sha: 'abc123',
        repo: { owner: { login: 'forkuser' }, name: 'open-source-pulse-wall' }
      }
    },
    fetchFn: async () => new Response(cheerJson, { status: 200 })
  });

  // First file loaded straight from base repo without touching fork repo
  assert.equal(blobRequests[0].owner, 'nanzhi84');
  assert.equal(fileContents['data/profiles/forkuser.json'], sampleJson);
  // Second file gracefully fell back to raw_url after API 404/403
  assert.equal(fileContents['data/cheers/bob/forkuser.json'], cheerJson);
});
