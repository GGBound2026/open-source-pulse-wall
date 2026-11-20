const assert = require('node:assert/strict');
const test = require('node:test');

const {
  sha256HexSync,
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

test('validateProfile accepts optional relic string or up to 2 strings and rejects invalid values', () => {
  assert.equal(validateProfile({ name: 'Alice', motto: 'Hi', relic: 'PULSE-2026' }, 'alice.json').errors.length, 0);
  assert.equal(
    validateProfile({ name: 'Alice', motto: 'Hi', relic: ['CODE-1', 'CODE-2'] }, 'alice.json').errors.length,
    0
  );
  assert.ok(validateProfile({ name: 'Alice', motto: 'Hi', relic: '' }, 'alice.json').errors.length > 0);
  assert.ok(
    validateProfile({ name: 'Alice', motto: 'Hi', relic: ['A', 'B', 'C'] }, 'alice.json').errors.length > 0
  );
  assert.ok(validateProfile({ name: 'Alice', motto: 'Hi', relic: 123 }, 'alice.json').errors.length > 0);
});

test('computeContributorScores enforces star cap, cheer cap 3, pair deduplication, multi-partner pair stacking, first-blood relic, and Star-gated Top 5 >= 1 threshold', () => {
  const secret1 = 'PULSE-ARCHAEOLOGY-01';
  const secretHash1 = sha256HexSync(secret1);

  const contributors = [
    {
      name: 'Alice',
      github: 'alice',
      file: 'alice.json',
      starred: true,
      joinedAt: '2026-11-10T00:00:00Z',
      relic: secret1, // copycat merged AFTER bob
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
      relic: secret1.toLowerCase(), // first-blood claimant!
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

  const relicDefinitions = [
    { id: 'relic-01', label: '远古暗号 #1', sha256: secretHash1, points: 2 }
  ];

  // Bob injected secret1 at 10:05, Alice copied it at 10:12 (even though Alice joined a day earlier!)
  const relicClaimTimes = {
    'data/profiles/bob.json': { [secretHash1]: { committedDate: '2026-11-15T10:05:00Z' } },
    'data/profiles/alice.json': { [secretHash1]: { committedDate: '2026-11-15T10:12:00Z' } }
  };

  const { contributors: scored, relics } = computeContributorScores({
    contributors,
    commits,
    relicDefinitions,
    relicClaimTimes
  });

  const byHandle = new Map(scored.map((c) => [c.github, c]));

  // Alice: Star (+1) + Cheers (4 targets capped at +3) + Pairs (bob, carol, dave = +6) + Relic (0, late!) = 10 pts -> Tier 3!
  const alice = byHandle.get('alice');
  assert.equal(alice.score.points, 10);
  assert.equal(alice.score.vfxTier, 3);
  assert.equal(alice.score.tierId, 'tier-3');
  assert.equal(alice.score.breakdown.star, 1);
  assert.equal(alice.score.breakdown.cheers, 3);
  assert.equal(alice.score.breakdown.pair, 6);
  assert.equal(alice.score.breakdown.relic, 0);
  assert.equal(alice.score.breakdown.relicLate.length, 1);
  assert.equal(alice.score.breakdown.relicLate[0].winner, 'bob');
  assert.equal(alice.score.isTop5, true);
  assert.equal(Object.hasOwn(alice, 'relic'), false); // plaintext stripped!

  // Bob: Star (+1) + Cheers (alice = +1) + Pairs (alice = +2) + Relic (FIRST BLOOD = +2) = 6 pts -> Tier 2!
  const bob = byHandle.get('bob');
  assert.equal(bob.score.points, 6);
  assert.equal(bob.score.vfxTier, 2);
  assert.equal(bob.score.breakdown.relic, 2);
  assert.deepEqual(bob.score.breakdown.relicIds, ['relic-01']);
  assert.equal(bob.score.isTop5, true);
  assert.equal(Object.hasOwn(bob, 'relic'), false);

  // Dave: Star (+1) + Cheers (alice = +1) + Pairs (alice, eve = +4) = 6 pts -> Tier 2!
  const dave = byHandle.get('dave');
  assert.equal(dave.score.points, 6);
  assert.equal(dave.score.vfxTier, 2);
  assert.equal(dave.score.isTop5, true);

  // Carol: Star (+1) + Cheers (0) + Pairs (alice = +2) = 3 pts -> Tier 1! (Starred & >= 1 pt, rank 4 -> Top 5!)
  const carol = byHandle.get('carol');
  assert.equal(carol.score.points, 3);
  assert.equal(carol.score.vfxTier, 1);
  assert.equal(carol.score.isTop5, true);

  // Eve: Unstarred (0) + Pairs (dave = +2; empty commit with bob ignored!) = 2 pts -> Locked (vfxTier 0) & NOT Top 5!
  const eve = byHandle.get('eve');
  assert.equal(eve.score.points, 2);
  assert.equal(eve.score.vfxTier, 0);
  assert.equal(eve.score.tierId, 'locked');
  assert.equal(eve.score.isTop5, false);

  assert.equal(relics[0].claimed, true);
  assert.equal(relics[0].claimedBy, 'bob');
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
    // Valid 3-person pair commit (primary alice + 2 co-authors bob, carol):
    // must credit (alice, bob) and (alice, carol), but NOT (bob, carol)!
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
    // Abuse commit: dave tags 3 classmates in one commit -> ENTIRE commit ignored!
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
