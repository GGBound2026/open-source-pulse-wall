const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

test('documentation and GitHub templates have no broken relative parent links or missing local files', () => {
  const docFiles = [
    'README.md',
    'SCORING.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/ISSUE_TEMPLATE/config.yml',
    '.github/ISSUE_TEMPLATE/01-question.yml',
    '.github/ISSUE_TEMPLATE/02-bug.yml',
    '.github/ISSUE_TEMPLATE/03-idea.yml'
  ];

  for (const relFile of docFiles) {
    const fullPath = path.join(ROOT, relFile);
    assert.ok(fs.existsSync(fullPath), `Expected doc file to exist: ${relFile}`);
    const content = fs.readFileSync(fullPath, 'utf8');

    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].trim();
      if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('#')) {
        continue;
      }

      assert.equal(
        target.startsWith('../'),
        false,
        `${relFile} contains fragile parent-traversal link "${target}" that breaks on GitHub root / Issue Forms`
      );

      const cleanTarget = target.split('#')[0].split('?')[0];
      if (!cleanTarget) continue;
      const resolved = path.resolve(path.dirname(fullPath), cleanTarget);
      assert.ok(
        fs.existsSync(resolved),
        `${relFile} references missing local path "${target}"`
      );
    }
  }
});
