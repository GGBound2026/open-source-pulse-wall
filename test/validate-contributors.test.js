const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  validateProfile,
  validateCheerEntry,
  validateJsonFormatting,
  readAndValidateAll
} = require('../scripts/validate-contributors');

function validProfile(overrides = {}) {
  return {
    name: 'Safe User',
    motto: 'Ship carefully',
    ...overrides
  };
}

function createTempRepo(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-wall-validate-'));
  fs.mkdirSync(path.join(dir, 'data', 'profiles'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data', 'cheers'), { recursive: true });

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(dir, relPath);
    if (content === null) {
      fs.mkdirSync(fullPath, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  return dir;
}

test('accepts minimal profile without github, avatar, homepage, cheers, role, stack, or style', () => {
  assert.equal(validateProfile(validProfile(), 'safe-user.json').errors.length, 0);
});

test('rejects unedited template placeholder name on non-template files', () => {
  const result = validateProfile(validProfile({ name: '你的名字' }), 'octocat.json');
  assert.match(result.errors.join('\n'), /你的名字/);
});

test('rejects inline cheers on profile files (both non-empty and empty) and directs to data/cheers', () => {
  const nonEmpty = validateProfile(
    validProfile({
      cheers: [{ message: 'Inline cheer' }]
    }),
    'safe-user.json'
  );
  assert.match(nonEmpty.errors.join('\n'), /data\/cheers/);

  const empty = validateProfile(validProfile({ cheers: [] }), 'safe-user.json');
  assert.match(empty.errors.join('\n'), /data\/cheers/);
});

test('rejects unknown keys in profile and cheer JSON', () => {
  const profileResult = validateProfile(
    validProfile({ City: 'Beijing', github: 'alice', extra: true }),
    'alice.json'
  );
  assert.match(profileResult.errors.join('\n'), /未允许的字段/);
  assert.match(profileResult.errors.join('\n'), /City/);
  assert.match(profileResult.errors.join('\n'), /github/);

  const cheerResult = validateCheerEntry(
    { message: '加油！', msg: 'typo' },
    'data/cheers/alice/bob.json'
  );
  assert.match(cheerResult.errors.join('\n'), /未允许的字段/);
  assert.match(cheerResult.errors.join('\n'), /msg/);

  const manualMetaCheer = validateCheerEntry(
    { message: '加油！', from: 'someone-else', ts: '2026-05-12' },
    'data/cheers/alice/bob.json'
  );
  assert.match(manualMetaCheer.errors.join('\n'), /无需填写 from、ts/);
  assert.match(manualMetaCheer.errors.join('\n'), /自动识别/);
});

test('accepts standalone cheer file with only message and no from or ts', () => {
  const result = validateCheerEntry(
    { message: '加油，写得很清晰！' },
    'data/cheers/devillord6321/arbitrary-name.json'
  );
  assert.equal(result.errors.length, 0);
});

test('validates JSON formatting (2-space indent, LF, no BOM)', () => {
  const data = { name: 'Alice', motto: 'Hello' };
  const formatted = JSON.stringify(data, null, 2);

  assert.equal(validateJsonFormatting(formatted, data, 'alice.json').length, 0);
  assert.equal(validateJsonFormatting(`${formatted}\n`, data, 'alice.json').length, 0);

  assert.match(
    validateJsonFormatting(JSON.stringify(data), data, 'alice.json').join('\n'),
    /2 空格缩进/
  );
  assert.match(
    validateJsonFormatting(JSON.stringify(data, null, 4), data, 'alice.json').join('\n'),
    /2 空格缩进/
  );
  assert.match(
    validateJsonFormatting(`${formatted.replace(/\n/g, '\r\n')}\r\n`, data, 'alice.json').join('\n'),
    /LF/
  );
  assert.match(
    validateJsonFormatting(`\uFEFF${formatted}\n`, data, 'alice.json').join('\n'),
    /UTF-8 BOM/
  );
});

test('accepts mixed-case GitHub handle filenames and matches cheer target case-insensitively', (t) => {
  const dir = createTempRepo({
    'data/profiles/_template.json': `${JSON.stringify({ name: '你的名字', motto: 'hi', city: 'Beijing' }, null, 2)}\n`,
    'data/profiles/Divine-Ashes.json': `${JSON.stringify({ name: 'Alice', motto: 'Hello OSS', city: 'Beijing' }, null, 2)}\n`,
    'data/cheers/_template.json': `${JSON.stringify({ message: '赞' }, null, 2)}\n`,
    'data/cheers/divine-ashes/Bob.json': `${JSON.stringify({ message: '写得真好！' }, null, 2)}\n`
  });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const result = readAndValidateAll({ rootDir: dir });
  assert.deepEqual(result.errors, []);
  assert.equal(result.contributors.length, 1);
  assert.equal(result.cheerEntries.length, 1);
});

test('rejects stray non-json files, subdirectories, underscore files, and invalid handles in data/', (t) => {
  const dir = createTempRepo({
    'data/profiles/readme.txt': 'oops',
    'data/profiles/_alice.json': `${JSON.stringify({ name: 'Alice', motto: 'hi' }, null, 2)}\n`,
    'data/profiles/nested/alice.json': `${JSON.stringify({ name: 'Alice', motto: 'hi' }, null, 2)}\n`,
    'data/profiles/非法名字.json': `${JSON.stringify({ name: 'Alice', motto: 'hi' }, null, 2)}\n`,
    'data/profiles/-bad-.json': `${JSON.stringify({ name: 'Bad', motto: 'hi' }, null, 2)}\n`,
    'data/profiles/valid-user.json': `${JSON.stringify({ name: 'Valid', motto: 'hi' }, null, 2)}\n`,
    'data/cheers/stray.json': `${JSON.stringify({ message: 'wrong level' }, null, 2)}\n`,
    'data/cheers/_hidden/a.json': `${JSON.stringify({ message: 'hidden dir' }, null, 2)}\n`,
    'data/cheers/valid-user/sub/a.json': `${JSON.stringify({ message: 'nested' }, null, 2)}\n`,
    'data/cheers/valid-user/_draft.json': `${JSON.stringify({ message: 'draft' }, null, 2)}\n`,
    'data/cheers/valid-user/note.txt': 'not json',
    'data/cheers/valid-user/非法.json': `${JSON.stringify({ message: 'bad name' }, null, 2)}\n`,
    'data/cheers/Valid-User/alice.json': `${JSON.stringify({ message: 'upper dir' }, null, 2)}\n`
  });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const { errors } = readAndValidateAll({ rootDir: dir });
  const joined = errors.join('\n');

  assert.match(joined, /data\/profiles\/readme\.txt: 文件必须以 \.json 结尾/);
  assert.match(joined, /data\/profiles\/_alice\.json: 文件名不能以 "_" 开头/);
  assert.match(joined, /data\/profiles\/nested: 不允许在 data\/profiles\/ 下创建子目录/);
  assert.match(joined, /data\/profiles\/非法名字\.json: 文件名 "非法名字" 不是合法的 GitHub 用户名/);
  assert.match(joined, /data\/profiles\/-bad-\.json: 文件名 "-bad-" 不是合法的 GitHub 用户名/);
  assert.match(joined, /data\/cheers\/stray\.json: 寄语文件必须放在 data\/cheers\/<目标用户名小写>\/<你的GitHub用户名>\.json/);
  assert.match(joined, /data\/cheers\/_hidden: 寄语目标目录名不能以 "_" 开头/);
  assert.match(joined, /data\/cheers\/valid-user\/sub: 不允许在寄语目录下嵌套子目录/);
  assert.match(joined, /data\/cheers\/valid-user\/_draft\.json: 寄语文件名不能以 "_" 开头/);
  assert.match(joined, /data\/cheers\/valid-user\/note\.txt: 寄语文件必须以 \.json 结尾/);
  assert.match(joined, /data\/cheers\/valid-user\/非法\.json: 寄语文件名 "非法" 必须是合法的 GitHub 用户名/);
  if (fs.existsSync(path.join(dir, 'data', 'cheers', 'Valid-User'))) {
    // On case-insensitive macOS APFS, creating Valid-User merges into valid-user; test separately below.
  }
});

test('rejects non-lowercase cheer target directory names', (t) => {
  const dir = createTempRepo({
    'data/profiles/Divine-Ashes.json': `${JSON.stringify({ name: 'Alice', motto: 'hi' }, null, 2)}\n`,
    'data/cheers/Divine-Ashes/bob.json': `${JSON.stringify({ message: 'upper dir' }, null, 2)}\n`
  });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const { errors } = readAndValidateAll({ rootDir: dir });
  assert.match(errors.join('\n'), /data\/cheers\/Divine-Ashes: 寄语目标目录名必须使用全小写/);
});

test('detects case-insensitive duplicate profile filenames on case-sensitive filesystems', (t) => {
  const dir = createTempRepo({
    'data/profiles/alice.json': `${JSON.stringify({ name: 'Alice', motto: 'hi' }, null, 2)}\n`,
    'data/profiles/Alice.json': `${JSON.stringify({ name: 'Alice 2', motto: 'hi' }, null, 2)}\n`
  });
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const entries = fs.readdirSync(path.join(dir, 'data', 'profiles'));
  if (entries.length < 2) {
    // Case-insensitive filesystem (e.g. default macOS APFS) overwrites alice.json with Alice.json.
    return;
  }

  const { errors } = readAndValidateAll({ rootDir: dir });
  assert.match(errors.join('\n'), /用户名重复（不区分大小写）/);
});
