const assert = require('node:assert/strict');
const test = require('node:test');

const {
  COMMENT_MARKER,
  buildNoticeMarker,
  normalizeGithubPrFiles,
  evaluatePrGuard,
  hasBlockingReview,
  hasHoldLabel,
  evaluateAutoMergeCandidate,
  formatGuardComment,
  formatMaintainerNoticeComment
} = require('../scripts/pr-guard');

test('normalizeGithubPrFiles maps GitHub API statuses and previous_filename', () => {
  const normalized = normalizeGithubPrFiles([
    { status: 'added', filename: 'data/profiles/alice.json', sha: '111' },
    { status: 'modified', filename: 'data/cheers/bob/alice.json', sha: '222' },
    { status: 'removed', filename: 'data/profiles/old.json', sha: '333' },
    { status: 'renamed', filename: 'data/profiles/b.json', previous_filename: 'data/profiles/a.json', sha: '444' }
  ]);

  assert.deepEqual(normalized, [
    { status: 'A', path: 'data/profiles/alice.json', sha: '111' },
    { status: 'M', path: 'data/cheers/bob/alice.json', sha: '222' },
    { status: 'D', path: 'data/profiles/old.json', sha: '333' },
    { status: 'R', path: 'data/profiles/b.json', previousPath: 'data/profiles/a.json', sha: '444' }
  ]);
});

test('evaluatePrGuard skips maintainers', () => {
  const result = evaluatePrGuard({
    prAuthor: 'nanzhi84',
    changedFiles: [{ status: 'M', path: '.github/workflows/pr-guard.yml' }],
    existingProfileFiles: []
  });

  assert.equal(result.ok, true);
  assert.equal(result.skipped, true);
});

test('evaluatePrGuard passes valid profile + cheer PR and formats success comment', () => {
  const profileJson = `${JSON.stringify({ name: 'Alice', motto: 'Hello OSS', city: 'Beijing' }, null, 2)}\n`;
  const cheerJson = `${JSON.stringify({ message: '写得很棒！' }, null, 2)}\n`;

  const result = evaluatePrGuard({
    prAuthor: 'Alice',
    changedFiles: [
      { status: 'A', path: 'data/profiles/alice.json' },
      { status: 'A', path: 'data/cheers/bob/alice.json' }
    ],
    fileContents: {
      'data/profiles/alice.json': profileJson,
      'data/cheers/bob/alice.json': cheerJson
    },
    existingProfileFiles: ['Bob.json']
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);

  const comment = formatGuardComment(result, { headSha: 'abcdef1234567890' });
  assert.match(comment, new RegExp(COMMENT_MARKER));
  assert.match(comment, /自动格式与路径审查通过/);
  assert.match(comment, /`abcdef1`/);
  assert.match(comment, /@Alice/);
  assert.match(comment, /约 10 分钟后将此 PR 合入/);

  const draftComment = formatGuardComment(result, { headSha: 'abcdef1234567890', isDraft: true });
  assert.match(draftComment, /Draft PR/);
  assert.match(draftComment, /Ready for review/);

  const approvalComment = formatGuardComment(result, {
    headSha: 'abcdef1234567890',
    approvalRequired: true,
    workflowRunUrl: 'https://github.com/nanzhi84/open-source-pulse-wall/actions/runs/99'
  });
  assert.match(approvalComment, /@nanzhi84 @YJLEC/);
  assert.match(approvalComment, /Approve and run/);
  assert.match(approvalComment, new RegExp(buildNoticeMarker('validate_approval_required', 'abcdef1234567890')));
});

test('evaluatePrGuard blocks workflow tampering and content format errors and formats actionable comment', () => {
  const badCheer = JSON.stringify({ message: 'hi', from: 'someone', ts: '2026-05-12' });

  const result = evaluatePrGuard({
    prAuthor: 'alice',
    changedFiles: [
      { status: 'M', path: '.github/workflows/validate.yml' },
      { status: 'A', path: 'data/cheers/ghost-user/alice.json' }
    ],
    fileContents: {
      'data/cheers/ghost-user/alice.json': badCheer
    },
    existingProfileFiles: ['bob.json']
  });

  assert.equal(result.ok, false);
  assert.equal(result.pathErrors.length, 1);
  assert.ok(result.contentErrors.length >= 3);

  const comment = formatGuardComment(result);
  assert.match(comment, new RegExp(COMMENT_MARKER));
  assert.match(comment, /自动格式与路径审查未通过/);
  assert.match(comment, /变更范围与路径问题/);
  assert.match(comment, /文件内容与格式问题/);
  assert.match(comment, /\.github\/workflows\/validate\.yml/);
  assert.match(comment, /未找到目标贡献者 "ghost-user"/);
  assert.match(comment, /无需填写 from、ts/);
  assert.match(comment, /2 空格缩进/);
});

test('evaluatePrGuard detects case-insensitive duplicate profile against existing main profiles', () => {
  const profileJson = `${JSON.stringify({ name: 'Alice', motto: 'Hi' }, null, 2)}\n`;

  const result = evaluatePrGuard({
    prAuthor: 'alice',
    changedFiles: [{ status: 'A', path: 'data/profiles/alice.json' }],
    fileContents: { 'data/profiles/alice.json': profileJson },
    existingProfileFiles: ['Alice.json']
  });

  assert.equal(result.ok, false);
  assert.match(result.contentErrors.join('\n'), /用户名重复（不区分大小写）/);
});

test('evaluatePrGuard detects case-insensitive duplicate cheer target directory and filename', () => {
  const cheerJson = `${JSON.stringify({ message: '写得很棒！' }, null, 2)}\n`;

  const result = evaluatePrGuard({
    prAuthor: 'alice',
    changedFiles: [
      { status: 'A', path: 'data/cheers/Bob/alice.json' }
    ],
    fileContents: {
      'data/cheers/Bob/alice.json': cheerJson
    },
    existingProfileFiles: ['bob.json'],
    existingCheerFiles: [
      { target: 'bob', file: 'Alice.json', relPath: 'data/cheers/bob/Alice.json' }
    ]
  });

  assert.equal(result.ok, false);
  const joined = result.contentErrors.join('\n');
  assert.match(joined, /data\/cheers\/Bob: 与已有目录 data\/cheers\/bob 重复（不区分大小写）/);
  assert.match(joined, /data\/cheers\/Bob\/alice\.json: 与已有文件 data\/cheers\/bob\/Alice\.json 文件名重复（不区分大小写）/);
});

test('evaluatePrGuard enforces 50-cheer limit per profile while allowing updates to existing cheers', () => {
  const cheerJson = `${JSON.stringify({ message: '加油！' }, null, 2)}\n`;
  const existingFifty = Array.from({ length: 50 }, (_, idx) => ({
    target: 'bob',
    file: idx === 0 ? 'alice.json' : `user-${idx}.json`,
    relPath: `data/cheers/bob/${idx === 0 ? 'alice.json' : `user-${idx}.json`}`
  }));

  const overLimit = evaluatePrGuard({
    prAuthor: 'charlie',
    changedFiles: [{ status: 'A', path: 'data/cheers/bob/charlie.json' }],
    fileContents: { 'data/cheers/bob/charlie.json': cheerJson },
    existingProfileFiles: ['bob.json'],
    existingCheerFiles: existingFifty
  });

  assert.equal(overLimit.ok, false);
  assert.match(overLimit.contentErrors.join('\n'), /data\/cheers\/bob: 寄语最多 50 条/);

  const updateOwn = evaluatePrGuard({
    prAuthor: 'alice',
    changedFiles: [{ status: 'M', path: 'data/cheers/bob/alice.json' }],
    fileContents: { 'data/cheers/bob/alice.json': cheerJson },
    existingProfileFiles: ['bob.json'],
    existingCheerFiles: existingFifty
  });

  assert.equal(updateOwn.ok, true);
  assert.deepEqual(updateOwn.errors, []);
});

test('evaluatePrGuard detects case-insensitive duplicate profile files within the same PR', () => {
  const profileJson = `${JSON.stringify({ name: 'Alice', motto: 'Hi' }, null, 2)}\n`;
  const result = evaluatePrGuard({
    prAuthor: 'alice',
    changedFiles: [
      { status: 'A', path: 'data/profiles/alice.json' },
      { status: 'A', path: 'data/profiles/Alice.json' }
    ],
    fileContents: {
      'data/profiles/alice.json': profileJson,
      'data/profiles/Alice.json': profileJson
    },
    existingProfileFiles: []
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /重复（不区分大小写）/);
});

test('hasBlockingReview respects latest non-comment review state per reviewer', () => {
  assert.deepEqual(
    hasBlockingReview([
      { user: { login: 'teacher' }, state: 'CHANGES_REQUESTED' },
      { user: { login: 'teacher' }, state: 'COMMENTED' }
    ]),
    { blocked: true, reviewers: ['teacher'] }
  );

  assert.deepEqual(
    hasBlockingReview([
      { user: { login: 'teacher' }, state: 'CHANGES_REQUESTED' },
      { user: { login: 'teacher' }, state: 'APPROVED' }
    ]),
    { blocked: false, reviewers: [] }
  );

  assert.deepEqual(
    hasBlockingReview([
      { user: { login: 'teacher' }, state: 'CHANGES_REQUESTED' },
      { user: { login: 'teacher' }, state: 'DISMISSED' }
    ]),
    { blocked: false, reviewers: [] }
  );
});

test('evaluateAutoMergeCandidate enforces reviews, hold labels, 10-min delay, and new-account maintainer notice', () => {
  const basePr = {
    number: 42,
    state: 'open',
    merged: false,
    draft: false,
    created_at: '2026-11-20T10:00:00Z',
    user: { login: 'student1' },
    base: { ref: 'main' },
    head: { sha: 'abc1234567890' },
    labels: []
  };

  const guardGreen = {
    id: 10,
    name: 'pr-guard',
    status: 'completed',
    conclusion: 'success',
    completed_at: '2026-11-20T10:00:10Z'
  };
  const validateGreen = {
    id: 11,
    name: 'validate',
    status: 'completed',
    conclusion: 'success',
    completed_at: '2026-11-20T10:00:20Z'
  };

  // Hold label blocks auto-merge
  assert.deepEqual(hasHoldLabel([{ name: 'Do-Not-Merge' }]), ['Do-Not-Merge']);
  assert.equal(
    evaluateAutoMergeCandidate({
      pr: { ...basePr, labels: [{ name: 'hold' }] },
      checkRuns: [guardGreen, validateGreen],
      nowMs: Date.parse('2026-11-20T10:10:00Z')
    }).reason,
    'hold_label'
  );

  // Request changes blocks auto-merge
  assert.equal(
    evaluateAutoMergeCandidate({
      pr: basePr,
      reviews: [{ user: { login: 'YJLEC' }, state: 'CHANGES_REQUESTED' }],
      checkRuns: [guardGreen, validateGreen],
      nowMs: Date.parse('2026-11-20T10:10:00Z')
    }).reason,
    'changes_requested'
  );

  // Newly registered account hits action_required -> notify maintainers, do NOT merge
  const approvalNeeded = evaluateAutoMergeCandidate({
    pr: basePr,
    checkRuns: [guardGreen],
    workflowRuns: [
      {
        id: 200,
        name: 'Validate contributors',
        event: 'pull_request',
        status: 'completed',
        conclusion: 'action_required',
        html_url: 'https://github.com/nanzhi84/open-source-pulse-wall/actions/runs/200'
      }
    ],
    nowMs: Date.parse('2026-11-20T10:00:30Z')
  });
  assert.equal(approvalNeeded.action, 'needs_maintainer');
  assert.equal(approvalNeeded.reason, 'validate_approval_required');

  const noticeBody = formatMaintainerNoticeComment({
    reason: approvalNeeded.reason,
    prAuthor: 'student1',
    headSha: basePr.head.sha,
    workflowRunUrl: approvalNeeded.workflowRunUrl
  });
  assert.match(noticeBody, /@nanzhi84 @YJLEC/);
  assert.match(noticeBody, /Approve and run/);

  // Before 10 minutes -> wait
  const cooling = evaluateAutoMergeCandidate({
    pr: basePr,
    checkRuns: [guardGreen, validateGreen],
    nowMs: Date.parse('2026-11-20T10:08:00Z')
  });
  assert.equal(cooling.action, 'wait');
  assert.equal(cooling.reason, 'cooling_down');

  // After 10 minutes -> merge
  const ready = evaluateAutoMergeCandidate({
    pr: basePr,
    checkRuns: [guardGreen, validateGreen],
    nowMs: Date.parse('2026-11-20T10:10:15Z')
  });
  assert.equal(ready.action, 'merge');
  assert.equal(ready.reason, 'ready');
});
