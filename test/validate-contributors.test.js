const assert = require('node:assert/strict');
const test = require('node:test');

const { validateProfile, validateCheerEntry } = require('../scripts/validate-contributors');

function validProfile(overrides = {}) {
  return {
    name: 'Safe User',
    motto: 'Ship carefully',
    ...overrides
  };
}

test('accepts minimal profile without github, avatar, homepage, cheers, role, stack, or style', () => {
  assert.equal(validateProfile(validProfile(), 'safe-user.json').errors.length, 0);
});

test('rejects unedited template placeholder name on non-template files', () => {
  const result = validateProfile(validProfile({ name: '你的名字' }), 'octocat.json');
  assert.match(result.errors.join('\n'), /你的名字/);
});

test('rejects non-empty inline cheers on profile files and directs to data/cheers', () => {
  const result = validateProfile(
    validProfile({
      cheers: [{ message: 'Inline cheer' }]
    }),
    'safe-user.json'
  );
  assert.match(result.errors.join('\n'), /data\/cheers/);
});

test('accepts standalone cheer file with only message and no from or ts', () => {
  const result = validateCheerEntry(
    { message: '加油，写得很清晰！' },
    'data/cheers/devillord6321/arbitrary-name.json',
    { targetOwner: 'devillord6321' }
  );
  assert.equal(result.errors.length, 0);
});
