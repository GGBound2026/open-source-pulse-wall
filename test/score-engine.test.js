const assert = require('node:assert/strict');
const test = require('node:test');

const {
  computeContributorScores,
  resolveVfxTier
} = require('../scripts/score-engine');
const { validateProfile } = require('../scripts/validate-contributors');

test('resolveVfxTier enforces Star hard gate and exact 1 / 3 / 6 / 10 thresholds', () => {
  assert.equal(resolveVfxTier(12, false).vfxTier, 0);
  assert.equal(resolveVfxTier(12, false).tierId, 'locked');

  assert.equal(resolveVfxTier(1, true).vfxTier, 0);
  assert.equal(resolveVfxTier(1, true).tierId, 'star-card');
  assert.equal(resolveVfxTier(2, true).vfxTier, 0);

  assert.equal(resolveVfxTier(3, true).vfxTier, 1);
  assert.equal(resolveVfxTier(5, true).vfxTier, 1);

  assert.equal(resolveVfxTier(6, true).vfxTier, 2);
  assert.equal(resolveVfxTier(9, true).vfxTier, 2);

  assert.equal(resolveVfxTier(10, true).vfxTier, 3);
  assert.equal(resolveVfxTier(14, true).vfxTier, 3);
});

test('validateProfile rejects removed relic field as unknown key', () => {
  const result = validateProfile({ name: 'Alice', motto: 'Hi', relic: 'PULSE-2026' }, 'alice.json');
  assert.match(result.errors.join('\n'), /未允许的字段.*relic/);
});

test('computeContributorScores enforces star cap, cheer cap 3, pair deduplication, multi-partner pair stacking, and Star-gated Top 5 >= 1 threshold', () => {
  const contributors = [
    {
      name: 'Alice',
      github: 'alice',
      file: 'alice.json',
      starred: true,
      joinedAt: '2026-11-10T00:00:00Z',
      cheers: [
        { from: 'bob', message: 'Nice!' },
        { from: 'dave', message: 'Great!' }
      ]
    },
    {
      name: 'Bob',
      github: 'bob',
      file: 'bob.json',
      starred: true,
      joinedAt: '2026-11-11T00:00:00Z',
      cheers: [
        { from: 'alice', message: 'Go Bob 1!' },
        { from: 'alice', message: 'Go Bob 2!' } // duplicate target from alice -> counts once
      ]
    },
    {
      name: 'Carol',
      github: 'carol',
      file: 'carol.json',
      starred: true,
      joinedAt: '2026-11-12T00:00:00Z',
      cheers: [{ from: 'alice', message: 'Go Carol!' }]
    },
    {
      name: 'Dave',
      github: 'dave',
      file: 'dave.json',
      starred: true,
      joinedAt: '2026-11-13T00:00:00Z',
      cheers: [{ from: 'alice', message: 'Go Dave!' }]
    },
    {
      name: 'Eve',
      github: 'eve',
      file: 'eve.json',
      starred: false, // NOT starred -> hard-gated even with points!
      joinedAt: '2026-11-14T00:00:00Z',
      cheers: [{ from: 'alice', message: 'Go Eve (4th target capped at 3)!' }]
    }
  ];

  const commits = [
    // Valid pair #1: alice + bob (repeated twice -> must only count ONCE = +2 each)
    {
      sha: 'c1',
      author: 'alice',
      changedFiles: 1,
      prMerged: true,
      fullMessage: 'feat: pair 1\n\nCo-authored-by: Bob <123+bob@users.noreply.github.com>'
    },
    {
      sha: 'c2',
      author: 'bob',
      changedFiles: 1,
      prMerged: true,
      fullMessage: 'feat: pair 1 repeat\n\nCo-authored-by: Alice <alice@users.noreply.github.com>'
    },
    // Valid pair #2: alice + carol (+2 each)
    {
      sha: 'c3',
      author: 'carol',
      changedFiles: 2,
      prMerged: true,
      authors: [{ login: 'carol' }, { login: 'alice' }],
      fullMessage: 'feat: pair with alice'
    },
    // Valid pair #3: alice + dave (+2 each) -> alice helps 3 distinct classmates = +6 pair points!
    {
      sha: 'c4',
      author: 'dave',
      changedFiles: 1,
      prMerged: true,
      fullMessage: 'feat: pair with alice\n\nCo-authored-by: alice <alice@example.com>'
    },
    // Anti-abuse: empty commit -> MUST be ignored!
    {
      sha: 'c5',
      author: 'eve',
      changedFiles: 0,
      prMerged: true,
      fullMessage: 'chore: empty\n\nCo-authored-by: bob <bob@users.noreply.github.com>'
    },
    // Anti-abuse: fake ghost handle -> MUST be ignored!
    {
      sha: 'c6',
      author: 'carol',
      changedFiles: 1,
      prMerged: true,
      fullMessage: 'feat: ghost\n\nCo-authored-by: GhostUser <ghost@users.noreply.github.com>'
    },
    // Valid pair #4: eve + dave (eve is unstarred)
    {
      sha: 'c7',
      author: 'eve',
      changedFiles: 1,
      prMerged: true,
      fullMessage: 'feat: real pair\n\nCo-authored-by: dave <dave@users.noreply.github.com>'
    }
  ];

  const { contributors: scored } = computeContributorScores({
    contributors,
    commits
  });

  const byHandle = new Map(scored.map((c) => [c.github, c]));

  // Alice: Star (+1) + Cheers (4 targets capped at +3) + Pairs (bob, carol, dave = +6) = 10 pts -> Tier 3!
  const alice = byHandle.get('alice');
  assert.equal(alice.score.points, 10);
  assert.equal(alice.score.vfxTier, 3);
  assert.equal(alice.score.tierId, 'tier-3');
  assert.equal(alice.score.breakdown.star, 1);
  assert.equal(alice.score.breakdown.cheers, 3);
  assert.equal(alice.score.breakdown.pair, 6);
  assert.equal(alice.score.isTop5, true);

  // Bob: Star (+1) + Cheers (alice = +1) + Pairs (alice = +2) = 4 pts -> Tier 1!
  const bob = byHandle.get('bob');
  assert.equal(bob.score.points, 4);
  assert.equal(bob.score.vfxTier, 1);
  assert.equal(bob.score.isTop5, true);

  // Dave: Star (+1) + Cheers (alice = +1) + Pairs (alice, eve = +4) = 6 pts -> Tier 2!
  const dave = byHandle.get('dave');
  assert.equal(dave.score.points, 6);
  assert.equal(dave.score.vfxTier, 2);
  assert.equal(dave.score.isTop5, true);

  // Carol: Star (+1) + Cheers (0) + Pairs (alice = +2) = 3 pts -> Tier 1!
  const carol = byHandle.get('carol');
  assert.equal(carol.score.points, 3);
  assert.equal(carol.score.vfxTier, 1);
  assert.equal(carol.score.isTop5, true);

  // Eve: Unstarred (0) + Pairs (dave = +2; empty commit with bob ignored!) = 2 pts -> Locked & NOT Top 5!
  const eve = byHandle.get('eve');
  assert.equal(eve.score.points, 2);
  assert.equal(eve.score.vfxTier, 0);
  assert.equal(eve.score.tierId, 'locked');
  assert.equal(eve.score.isTop5, false);
});

test('computeContributorScores blocks mass Co-authored-by farming (>2 partners) and avoids phantom co-author cross-pairs', () => {
  const contributors = ['alice', 'bob', 'carol', 'dave', 'eve'].map((github) => ({
    name: github,
    github,
    file: `${github}.json`,
    starred: true,
    joinedAt: '2026-11-10T00:00:00Z',
    cheers: []
  }));

  const commits = [
    {
      sha: 'pair-two',
      author: 'alice',
      changedFiles: 1,
      prMerged: true,
      fullMessage: [
        'feat: group pair',
        '',
        'Co-authored-by: Bob <bob@users.noreply.github.com>',
        'Co-authored-by: Carol <carol@users.noreply.github.com>'
      ].join('\n')
    },
    {
      sha: 'mass-farm',
      author: 'dave',
      changedFiles: 1,
      prMerged: true,
      fullMessage: [
        'chore: farm points',
        '',
        'Co-authored-by: Alice <alice@users.noreply.github.com>',
        'Co-authored-by: Bob <bob@users.noreply.github.com>',
        'Co-authored-by: Eve <eve@users.noreply.github.com>'
      ].join('\n')
    }
  ];

  const { contributors: scored } = computeContributorScores({ contributors, commits });
  const byHandle = new Map(scored.map((c) => [c.github, c]));

  assert.deepEqual(byHandle.get('alice').score.breakdown.pairPartners, ['bob', 'carol']);
  assert.deepEqual(byHandle.get('bob').score.breakdown.pairPartners, ['alice']);
  assert.deepEqual(byHandle.get('carol').score.breakdown.pairPartners, ['alice']);
  assert.deepEqual(byHandle.get('dave').score.breakdown.pairPartners, []);
  assert.deepEqual(byHandle.get('eve').score.breakdown.pairPartners, []);
});
