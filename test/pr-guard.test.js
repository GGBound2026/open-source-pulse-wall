const assert = require('node:assert/strict');
const test = require('node:test');

const {
  COMMENT_MARKER,
  normalizeGithubPrFiles,
  evaluatePrGuard,
  formatGuardComment
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
  assert.match(comment, /你的 PR 将在 5 分钟后自动合并/);
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
