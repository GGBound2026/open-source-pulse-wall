const assert = require('node:assert/strict');
const test = require('node:test');

const {
  parseNameStatusZ,
  validatePrDiff
} = require('../scripts/validate-pr-diff');

test('parseNameStatusZ parses add, modify, delete, rename, and copy entries', () => {
  const raw = [
    'A', 'data/profiles/alice.json',
    'M', 'data/cheers/bob/alice.json',
    'D', 'data/profiles/old.json',
    'R100', 'data/profiles/a.json', 'data/profiles/b.json',
    'C095', 'data/profiles/_template.json', 'data/profiles/c.json',
    ''
  ].join('\0');

  assert.deepEqual(parseNameStatusZ(raw), [
    { status: 'A', path: 'data/profiles/alice.json' },
    { status: 'M', path: 'data/cheers/bob/alice.json' },
    { status: 'D', path: 'data/profiles/old.json' },
    { status: 'R', previousPath: 'data/profiles/a.json', path: 'data/profiles/b.json' },
    { status: 'C', previousPath: 'data/profiles/_template.json', path: 'data/profiles/c.json' }
  ]);
});

test('exempts default maintainers (nanzhi84 and YJLEC) from PR path restrictions (case-insensitive)', () => {
  for (const author of ['Nanzhi84', 'yjlec']) {
    const result = validatePrDiff({
      prAuthor: author,
      changedFiles: [
        { status: 'M', path: '.github/workflows/validate.yml' },
        { status: 'M', path: 'scripts/validate-contributors.js' },
        { status: 'D', path: 'data/profiles/someone.json' }
      ]
    });

    assert.equal(result.ok, true);
    assert.equal(result.skipped, true);
    assert.deepEqual(result.errors, []);
  }
});

test('allows regular contributor to add or update own profile and own cheer file under lowercase target dir', () => {
  const result = validatePrDiff({
    prAuthor: 'Divine-Ashes',
    changedFiles: [
      { status: 'A', path: 'data/profiles/divine-ashes.json' },
      { status: 'A', path: 'data/cheers/bob/divine-ashes.json' },
      { status: 'M', path: 'data/cheers/charlie/Divine-Ashes.json' }
    ]
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('rejects arbitrary cheer filenames, uppercase cheer target dirs, and case-insensitive duplicates within same PR', () => {
  const result = validatePrDiff({
    prAuthor: 'alice',
    changedFiles: [
      { status: 'A', path: 'data/profiles/alice.json' },
      { status: 'A', path: 'data/profiles/Alice.json' },
      { status: 'A', path: 'data/cheers/bob/charlie.json' },
      { status: 'A', path: 'data/cheers/bob/random-note.json' },
      { status: 'A', path: 'data/cheers/Bob/alice.json' },
      { status: 'A', path: 'data/cheers/charlie/alice.json' },
      { status: 'A', path: 'data/cheers/charlie/Alice.json' }
    ]
  });

  assert.equal(result.ok, false);
  const joined = result.errors.join('\n');
  assert.match(joined, /data\/profiles\/Alice\.json: 与本 PR 中的 data\/profiles\/alice\.json 文件名重复/);
  assert.match(joined, /data\/cheers\/bob\/charlie\.json: 寄语文件名必须使用你自己的 GitHub 用户名/);
  assert.match(joined, /data\/cheers\/bob\/random-note\.json: 寄语文件名必须使用你自己的 GitHub 用户名/);
  assert.match(joined, /data\/cheers\/Bob\/alice\.json: 寄语目标目录名必须使用全小写/);
  assert.match(joined, /data\/cheers\/charlie\/Alice\.json: 与本 PR 中的 data\/cheers\/charlie\/alice\.json 文件路径重复/);
});

test('rejects changes outside data/profiles/ and data/cheers/ for non-maintainers', () => {
  const result = validatePrDiff({
    prAuthor: 'alice',
    changedFiles: [
      { status: 'M', path: 'README.md' },
      { status: 'M', path: 'scripts/validate-contributors.js' },
      { status: 'M', path: '.github/workflows/validate.yml' }
    ]
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 3);
  assert.match(result.errors.join('\n'), /仅允许修改 data\/profiles\/ 和 data\/cheers\//);
});

test('rejects editing templates, editing/deleting others profiles, and self-cheers', () => {
  const result = validatePrDiff({
    prAuthor: 'alice',
    changedFiles: [
      { status: 'M', path: 'data/profiles/_template.json' },
      { status: 'M', path: 'data/cheers/_template.json' },
      { status: 'M', path: 'data/profiles/bob.json' },
      { status: 'D', path: 'data/profiles/alice.json' },
      { status: 'A', path: 'data/cheers/Alice/self.json' },
      { status: 'M', path: 'data/cheers/bob/charlie.json' },
      { status: 'R', previousPath: 'data/profiles/bob.json', path: 'data/profiles/alice.json' }
    ]
  });

  assert.equal(result.ok, false);
  const joined = result.errors.join('\n');
  assert.match(joined, /data\/profiles\/_template\.json: 不能修改模板文件/);
  assert.match(joined, /data\/cheers\/_template\.json: 不能修改模板文件/);
  assert.match(joined, /data\/profiles\/bob\.json: 你只能新增或修改自己的个人卡片/);
  assert.match(joined, /data\/profiles\/alice\.json: 普通 PR 不允许删除文件/);
  assert.match(joined, /data\/cheers\/Alice\/self\.json: 不能给自己写寄语/);
  assert.match(joined, /data\/cheers\/bob\/charlie\.json: 不能修改他人已有的寄语文件/);
  assert.match(joined, /data\/profiles\/bob\.json: 普通 PR 不允许删除文件/);
});

test('rejects misplaced files in data/profiles/ and data/cheers/', () => {
  const result = validatePrDiff({
    prAuthor: 'alice',
    changedFiles: [
      { status: 'A', path: 'data/profiles/sub/alice.json' },
      { status: 'A', path: 'data/cheers/bob.json' },
      { status: 'A', path: 'data/cheers/bob/sub/alice.json' },
      { status: 'A', path: 'data/cheers/bob/_draft.json' }
    ]
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 4);
});
