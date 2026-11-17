const assert = require('node:assert/strict');
const test = require('node:test');

const { validateProfile } = require('../scripts/validate-contributors');

function validProfile(overrides = {}) {
  return {
    name: 'Safe User',
    motto: 'Ship carefully',
    ...overrides
  };
}

test('accepts minimal profile without github, avatar, homepage, role, stack, or style', () => {
  assert.equal(validateProfile(validProfile(), 'safe-user.json').errors.length, 0);
});

test('rejects unedited template placeholder name on non-template files', () => {
  const result = validateProfile(validProfile({ name: '你的名字' }), 'octocat.json');
  assert.match(result.errors.join('\n'), /你的名字/);
});

test('rejects self-cheers matching file owner stem', () => {
  const result = validateProfile(
    validProfile({
      cheers: [{ from: 'safe-user', message: 'Self cheer' }]
    }),
    'safe-user.json'
  );
  assert.match(result.errors.join('\n'), /不能是 profile 主人自己/);
});
