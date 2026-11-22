const assert = require('node:assert/strict');
const test = require('node:test');

const scoreEngine = require('../scripts/score-engine');
const {
  TOP5_LIMIT,
  TIER_PERCENTILE_CUTOFFS,
  computeTierCutoffs,
  resolveRankTier,
  computeContributorScores
} = scoreEngine;
const { validateProfile } = require('../scripts/validate-contributors');

function makeContributors(starredCount, unstarredCount = 0) {
  const list = [];
  for (let i = 1; i <= starredCount; i += 1) {
    list.push({
      name: `Star ${i}`,
      github: `star-${String(i).padStart(3, '0')}`,
      file: `star-${String(i).padStart(3, '0')}.json`,
      starred: true,
      joinedAt: new Date(Date.parse('2026-11-10T00:00:00Z') + i * 1000).toISOString(),
      cheers: []
    });
  }
  for (let i = 1; i <= unstarredCount; i += 1) {
    list.push({
      name: `Outer ${i}`,
      github: `outer-${String(i).padStart(3, '0')}`,
      file: `outer-${String(i).padStart(3, '0')}.json`,
      starred: false,
      joinedAt: new Date(Date.parse('2026-11-12T00:00:00Z') + i * 1000).toISOString(),
      cheers: []
    });
  }
  return list;
}

test('score-engine exports pure rank-percentile API and removes fixed threshold exports', () => {
  assert.deepEqual(TIER_PERCENTILE_CUTOFFS, { tier3: 0.15, tier2: 0.5 });
  assert.equal(Object.hasOwn(scoreEngine, 'VFX_TIER_THRESHOLDS'), false);
  assert.equal(Object.hasOwn(scoreEngine, 'resolveVfxTier'), false);
});

test('computeTierCutoffs handles small-N fallbacks (M=0,1,2,3,44) and strict invariants up to M=200', () => {
  assert.deepEqual(computeTierCutoffs(0), { tier3End: 0, tier2End: 0 });
  assert.deepEqual(computeTierCutoffs(-4), { tier3End: 0, tier2End: 0 });
  assert.deepEqual(computeTierCutoffs(NaN), { tier3End: 0, tier2End: 0 });
  assert.deepEqual(computeTierCutoffs(1), { tier3End: 0, tier2End: 0 });
  assert.deepEqual(computeTierCutoffs(2), { tier3End: 0, tier2End: 1 });
  assert.deepEqual(computeTierCutoffs(3), { tier3End: 1, tier2End: 2 });
  assert.deepEqual(computeTierCutoffs(44), { tier3End: 7, tier2End: 22 });

  for (let m = 3; m <= 200; m += 1) {
    const { tier3End, tier2End } = computeTierCutoffs(m);
    assert.ok(tier3End >= 1, `M=${m}: tier3End=${tier3End}`);
    assert.ok(tier3End < tier2End, `M=${m}: tier3End=${tier3End} < tier2End=${tier2End}`);
    assert.ok(tier2End < m, `M=${m}: tier2End=${tier2End} < M`);
  }
});

test('resolveRankTier enforces Star gate, sun/top5 landmarks, and percentile cutoffs across M=0,1,2,3,44', () => {
  // Unstarred or invalid rank/count stays locked in outer belt
  assert.deepEqual(resolveRankTier({ starred: false, rank: 1, starredCount: 49 }), {
    vfxTier: 0,
    orbitId: 'outer',
    tierId: 'locked',
    tierLabel: '未点 Star',
    tierShort: '',
    poolRank: null,
    poolSize: 44,
    poolPercentile: null,
    rankPercentile: null
  });
  assert.equal(resolveRankTier({ starred: true, rank: 0, starredCount: 10 }).orbitId, 'outer');
  assert.equal(resolveRankTier({ starred: true, rank: 1, starredCount: 0 }).orbitId, 'outer');

  // M = 0 (starredCount = 5): sun + top5 only
  assert.deepEqual(resolveRankTier({ starred: true, rank: 1, starredCount: 5 }), {
    vfxTier: 3,
    orbitId: 'sun',
    tierId: 'sun',
    tierLabel: '恒星王座',
    tierShort: '王座',
    poolRank: null,
    poolSize: 0,
    poolPercentile: null,
    rankPercentile: 20
  });
  assert.deepEqual(resolveRankTier({ starred: true, rank: 5, starredCount: 5 }), {
    vfxTier: 3,
    orbitId: 'top5',
    tierId: 'top-5',
    tierLabel: '恒星近卫',
    tierShort: '近卫',
    poolRank: null,
    poolSize: 0,
    poolPercentile: null,
    rankPercentile: 100
  });

  // M = 1 (starredCount = 6): #6 goes to Tier 1 instead of Tier 3
  assert.deepEqual(resolveRankTier({ starred: true, rank: 6, starredCount: 6 }), {
    vfxTier: 1,
    orbitId: 'tier1',
    tierId: 'tier-1',
    tierLabel: '一阶 · 初醒破框',
    tierShort: '一阶',
    poolRank: 1,
    poolSize: 1,
    poolPercentile: 100,
    rankPercentile: 100
  });

  // M = 2 (starredCount = 7): #6 -> Tier 2, #7 -> Tier 1
  assert.equal(resolveRankTier({ starred: true, rank: 6, starredCount: 7 }).orbitId, 'tier2');
  assert.equal(resolveRankTier({ starred: true, rank: 6, starredCount: 7 }).poolPercentile, 50);
  assert.equal(resolveRankTier({ starred: true, rank: 7, starredCount: 7 }).orbitId, 'tier1');
  assert.equal(resolveRankTier({ starred: true, rank: 7, starredCount: 7 }).poolPercentile, 100);

  // M = 3 (starredCount = 8): #6 -> Tier 3, #7 -> Tier 2, #8 -> Tier 1
  assert.equal(resolveRankTier({ starred: true, rank: 6, starredCount: 8 }).orbitId, 'tier3');
  assert.equal(resolveRankTier({ starred: true, rank: 7, starredCount: 8 }).orbitId, 'tier2');
  assert.equal(resolveRankTier({ starred: true, rank: 8, starredCount: 8 }).orbitId, 'tier1');

  // M = 44 (starredCount = 49): 7 in tier3 (#6..#12), 15 in tier2 (#13..#27), 22 in tier1 (#28..#49)
  assert.equal(resolveRankTier({ starred: true, rank: 6, starredCount: 49 }).orbitId, 'tier3');
  assert.equal(resolveRankTier({ starred: true, rank: 12, starredCount: 49 }).orbitId, 'tier3');
  assert.equal(resolveRankTier({ starred: true, rank: 12, starredCount: 49 }).poolPercentile, 15.9);
  assert.equal(resolveRankTier({ starred: true, rank: 13, starredCount: 49 }).orbitId, 'tier2');
  assert.equal(resolveRankTier({ starred: true, rank: 27, starredCount: 49 }).orbitId, 'tier2');
  assert.equal(resolveRankTier({ starred: true, rank: 27, starredCount: 49 }).poolPercentile, 50);
  assert.equal(resolveRankTier({ starred: true, rank: 28, starredCount: 49 }).orbitId, 'tier1');
  assert.equal(resolveRankTier({ starred: true, rank: 49, starredCount: 49 }).orbitId, 'tier1');
  assert.equal(resolveRankTier({ starred: true, rank: 49, starredCount: 49 }).poolPercentile, 100);
});

test('validateProfile rejects removed relic field as unknown key', () => {
  const result = validateProfile({ name: 'Alice', motto: 'Hi', relic: 'PULSE-2026' }, 'alice.json');
  assert.match(result.errors.join('\n'), /未允许的字段.*relic/);
});

test('computeContributorScores enforces star cap, cheer cap 3, pair deduplication, multi-partner pair stacking, and rank-percentile orbits', () => {
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

  // Alice: Star (+1) + Cheers (4 targets capped at +3) + Pairs (bob, carol, dave = +6) = 10 pts -> #1 Sun!
  const alice = byHandle.get('alice');
  assert.equal(alice.score.points, 10);
  assert.equal(alice.score.rank, 1);
  assert.equal(alice.score.vfxTier, 3);
  assert.equal(alice.score.orbitId, 'sun');
  assert.equal(alice.score.tierId, 'sun');
  assert.equal(alice.score.tierLabel, '恒星王座');
  assert.equal(alice.score.tierShort, '王座');
  assert.equal(alice.score.starredTotal, 4);
  assert.equal(alice.score.poolSize, 0);
  assert.equal(alice.score.nextTierPoints, null);
  assert.equal(alice.score.breakdown.star, 1);
  assert.equal(alice.score.breakdown.cheers, 3);
  assert.equal(alice.score.breakdown.pair, 6);
  assert.equal(alice.score.isTop5, true);
  assert.deepEqual(alice.score.promotion, {
    targetOrbitId: null,
    targetLabel: null,
    targetHint: null,
    targetRank: 1,
    ranksNeeded: 0,
    thresholdPoints: 10,
    pointsToTie: 0,
    pointsToPass: 0,
    leadPoints: 4,
    progress: 100
  });

  // Dave: Star (+1) + Cheers (alice = +1) + Pairs (alice, eve = +4) = 6 pts -> #2 Top 5!
  const dave = byHandle.get('dave');
  assert.equal(dave.score.points, 6);
  assert.equal(dave.score.rank, 2);
  assert.equal(dave.score.vfxTier, 3);
  assert.equal(dave.score.orbitId, 'top5');
  assert.equal(dave.score.tierId, 'top-5');
  assert.equal(dave.score.isTop5, true);
  assert.equal(dave.score.promotion.targetOrbitId, 'sun');
  assert.equal(dave.score.promotion.targetRank, 1);
  assert.equal(dave.score.promotion.ranksNeeded, 1);
  assert.equal(dave.score.promotion.thresholdPoints, 10);
  assert.equal(dave.score.promotion.pointsToTie, 4);
  assert.equal(dave.score.promotion.pointsToPass, 5);

  // Bob: Star (+1) + Cheers (alice = +1) + Pairs (alice = +2) = 4 pts -> #3 Top 5!
  const bob = byHandle.get('bob');
  assert.equal(bob.score.points, 4);
  assert.equal(bob.score.rank, 3);
  assert.equal(bob.score.vfxTier, 3);
  assert.equal(bob.score.orbitId, 'top5');
  assert.equal(bob.score.isTop5, true);

  // Carol: Star (+1) + Cheers (0) + Pairs (alice = +2) = 3 pts -> #4 Top 5!
  const carol = byHandle.get('carol');
  assert.equal(carol.score.points, 3);
  assert.equal(carol.score.rank, 4);
  assert.equal(carol.score.vfxTier, 3);
  assert.equal(carol.score.orbitId, 'top5');
  assert.equal(carol.score.isTop5, true);

  // Eve: Unstarred (0) + Pairs (dave = +2; empty commit with bob ignored!) = 2 pts -> Locked in outer belt!
  const eve = byHandle.get('eve');
  assert.equal(eve.score.points, 2);
  assert.equal(eve.score.rank, 5);
  assert.equal(eve.score.vfxTier, 0);
  assert.equal(eve.score.orbitId, 'outer');
  assert.equal(eve.score.tierId, 'locked');
  assert.equal(eve.score.tierLabel, '未点 Star');
  assert.equal(eve.score.tierShort, '');
  assert.equal(eve.score.isTop5, false);
  assert.deepEqual(eve.score.promotion, {
    targetOrbitId: 'tier1',
    targetLabel: '星系排名轨道',
    targetHint: '点 Star 入轨',
    targetRank: null,
    ranksNeeded: null,
    thresholdPoints: 1,
    pointsToTie: 1,
    pointsToPass: 1,
    leadPoints: 0,
    progress: 0
  });
});

test('computeContributorScores enforces deterministic 6-level tie-breaker order and tied-gatekeeper promotion math', () => {
  const contributors = [
    // Unstarred with high points still sorts AFTER all starred contributors
    {
      name: 'Unstarred Ace',
      github: 'unstarred-ace',
      starred: false,
      joinedAt: '2026-11-01T00:00:00Z',
      cheers: [{ from: 'a-cheer', message: '1' }]
    },
    // All starred below have points = 2 (1 Star + 1 Cheer sent):
    {
      name: 'Handle Z',
      github: 'z-user',
      starred: true,
      joinedAt: '2026-11-10T00:00:00Z',
      cheers: [] // received 0
    },
    {
      name: 'Handle A',
      github: 'a-user',
      starred: true,
      joinedAt: '2026-11-10T00:00:00Z',
      cheers: [] // received 0, same joinedAt -> beats z-user via handle ASC
    },
    {
      name: 'Early Joined',
      github: 'early-user',
      starred: true,
      joinedAt: '2026-11-09T00:00:00Z',
      cheers: [] // received 0, earlier joinedAt -> beats a-user
    },
    {
      name: 'Popular',
      github: 'popular-user',
      starred: true,
      joinedAt: '2026-11-20T00:00:00Z',
      cheers: [{ from: 'z-user', message: 'cheers!' }] // received 1 -> beats early-user
    },
    // 3 pts (1 Star + 2 Cheers sent) -> beats 2-pt users
    {
      name: 'Active Cheerer',
      github: 'active-user',
      starred: true,
      joinedAt: '2026-11-25T00:00:00Z',
      cheers: []
    },
    // Cheers target sinks so active-user gets 2 sent and z/a/early/popular/active each get >=1 sent
    {
      name: 'Target 1',
      github: 'target-1',
      starred: true,
      joinedAt: '2026-11-30T00:00:00Z',
      cheers: [
        { from: 'z-user', message: 'hi' },
        { from: 'a-user', message: 'hi' },
        { from: 'early-user', message: 'hi' },
        { from: 'popular-user', message: 'hi' },
        { from: 'active-user', message: 'hi' }
      ]
    },
    {
      name: 'Target 2',
      github: 'target-2',
      starred: true,
      joinedAt: '2026-11-30T01:00:00Z',
      cheers: [{ from: 'active-user', message: 'hi 2' }]
    }
  ];

  // Wait: z-user sent 2 cheers (popular-user & target-1) -> give z-user only 1 cheer sent by cheering via popular-user elsewhere
  // Adjust: make target-1 cheered by a-user, early-user, popular-user, active-user; z-user cheers ONLY popular-user!
  contributors[6].cheers = contributors[6].cheers.filter((ch) => ch.from !== 'z-user');

  const { contributors: scored } = computeContributorScores({ contributors, commits: [] });
  const orderedHandles = scored
    .slice()
    .sort((a, b) => a.score.rank - b.score.rank)
    .map((c) => c.github);

  assert.deepEqual(orderedHandles, [
    'active-user', // 3 pts (1 + 2 cheers sent)
    'popular-user', // 2 pts, 1 sent, 1 received
    'early-user', // 2 pts, 1 sent, 0 received, Nov 09
    'a-user', // 2 pts, 1 sent, 0 received, Nov 10, 'a-user'
    'z-user', // 2 pts, 1 sent, 0 received, Nov 10, 'z-user'
    'target-1', // 1 pt, 0 sent, Nov 30 00:00 -> #6 (M=2 -> Tier 2)
    'target-2', // 1 pt, 0 sent, Nov 30 01:00 -> #7 (M=2 -> Tier 1)
    'unstarred-ace' // unstarred -> #8 (outer)
  ]);

  const byHandle = new Map(scored.map((c) => [c.github, c]));
  // Rank 7 (target-2) has 1 pt and targets Rank 6 (target-1) who also has 1 pt -> pointsToTie=0, pointsToPass=1!
  assert.equal(byHandle.get('target-2').score.orbitId, 'tier1');
  assert.equal(byHandle.get('target-2').score.promotion.targetOrbitId, 'tier2');
  assert.equal(byHandle.get('target-2').score.promotion.targetRank, 6);
  assert.equal(byHandle.get('target-2').score.promotion.thresholdPoints, 1);
  assert.equal(byHandle.get('target-2').score.promotion.pointsToTie, 0);
  assert.equal(byHandle.get('target-2').score.promotion.pointsToPass, 1);
  assert.equal(byHandle.get('target-2').score.promotion.progress, 96);

  // Rank 6 (target-1) is in Tier 2 with M=2 (tier3End=0) -> targets TOP 2-5 (#5 z-user, 2 pts)
  assert.equal(byHandle.get('target-1').score.orbitId, 'tier2');
  assert.equal(byHandle.get('target-1').score.promotion.targetOrbitId, 'top5');
  assert.equal(byHandle.get('target-1').score.promotion.targetRank, 5);
  assert.equal(byHandle.get('target-1').score.promotion.thresholdPoints, 2);
  assert.equal(byHandle.get('target-1').score.promotion.pointsToTie, 1);
  assert.equal(byHandle.get('target-1').score.promotion.pointsToPass, 2);
  assert.equal(byHandle.get('target-1').score.promotion.progress, 96);
});

test('computeContributorScores handles small-N fallbacks (M=0, M=1, M=3) and 64-contributor (M=44) cohort promotion math', () => {
  // M = 0 (only 5 starred, 0 in post-Top5 pool)
  {
    const { contributors: scored } = computeContributorScores({ contributors: makeContributors(5) });
    assert.deepEqual(
      scored.map((c) => c.score.orbitId),
      ['sun', 'top5', 'top5', 'top5', 'top5']
    );
    // Single starred edge case: 1 starred contributor -> leadPoints equals own points
    const { contributors: solo } = computeContributorScores({ contributors: makeContributors(1) });
    assert.equal(solo[0].score.orbitId, 'sun');
    assert.equal(solo[0].score.promotion.leadPoints, 1);
    assert.equal(solo[0].score.promotion.progress, 100);
  }

  // M = 1 (6 starred -> #6 in tier1 targeting top5 #5)
  {
    const { contributors: scored } = computeContributorScores({ contributors: makeContributors(6) });
    const sixth = scored.find((c) => c.score.rank === 6);
    assert.equal(sixth.score.orbitId, 'tier1');
    assert.equal(sixth.score.vfxTier, 1);
    assert.equal(sixth.score.poolRank, 1);
    assert.equal(sixth.score.poolSize, 1);
    assert.equal(sixth.score.poolPercentile, 100);
    assert.equal(sixth.score.promotion.targetOrbitId, 'top5');
    assert.equal(sixth.score.promotion.targetRank, 5);
    assert.equal(sixth.score.promotion.ranksNeeded, 1);
    assert.equal(sixth.score.promotion.progress, 96);
  }

  // M = 3 (8 starred -> #6 tier3, #7 tier2, #8 tier1)
  {
    const { contributors: scored } = computeContributorScores({ contributors: makeContributors(8) });
    const byRank = new Map(scored.map((c) => [c.score.rank, c.score]));
    assert.equal(byRank.get(6).orbitId, 'tier3');
    assert.equal(byRank.get(7).orbitId, 'tier2');
    assert.equal(byRank.get(8).orbitId, 'tier1');
    assert.equal(byRank.get(8).promotion.targetOrbitId, 'tier2');
    assert.equal(byRank.get(8).promotion.targetRank, 7);
    assert.equal(byRank.get(7).promotion.targetOrbitId, 'tier3');
    assert.equal(byRank.get(7).promotion.targetRank, 6);
    assert.equal(byRank.get(6).promotion.targetOrbitId, 'top5');
    assert.equal(byRank.get(6).promotion.targetRank, 5);
  }

  // M = 44 (49 starred + 15 unstarred = 64 contributors) with descending scores via pairs with unstarred handles
  const contributors = makeContributors(49, 15);
  const commits = [];
  for (let i = 0; i < 27; i += 1) {
    const pairCount = i === 0 ? 5 : (i < 5 ? 3 : (i < 12 ? 2 : 1));
    for (let p = 0; p < pairCount; p += 1) {
      const partner = contributors[49 + p];
      commits.push({
        sha: `p-${i}-${p}`,
        author: contributors[i].github,
        changedFiles: 1,
        prMerged: true,
        fullMessage: `feat: pair\n\nCo-authored-by: ${partner.github} <${partner.github}@users.noreply.github.com>`
      });
    }
  }

  const { contributors: scored } = computeContributorScores({ contributors, commits });
  const counts = { sun: 0, top5: 0, tier3: 0, tier2: 0, tier1: 0, outer: 0 };
  for (const c of scored) {
    counts[c.score.orbitId] += 1;
    assert.equal(c.score.starredTotal, 49);
    assert.equal(c.score.poolSize, 44);
    assert.equal(c.score.nextTierPoints, null);

    if (c.score.orbitId === 'sun') {
      assert.equal(c.score.promotion.progress, 100);
    } else if (c.score.orbitId === 'outer') {
      assert.equal(c.score.promotion.progress, 0);
    } else {
      assert.ok(
        c.score.promotion.progress >= 8 && c.score.promotion.progress <= 96,
        `rank ${c.score.rank} (${c.score.orbitId}) progress=${c.score.promotion.progress}`
      );
      assert.ok(c.score.promotion.ranksNeeded >= 1);
      assert.equal(c.score.promotion.leadPoints, 0);
    }
  }

  assert.deepEqual(counts, { sun: 1, top5: 4, tier3: 7, tier2: 15, tier1: 22, outer: 15 });

  // Verify specific promotion targets at boundaries
  const byRank = new Map(scored.map((c) => [c.score.rank, c.score]));
  assert.equal(byRank.get(49).orbitId, 'tier1');
  assert.equal(byRank.get(49).promotion.targetOrbitId, 'tier2');
  assert.equal(byRank.get(49).promotion.targetRank, TOP5_LIMIT + 22);
  assert.equal(byRank.get(49).promotion.progress, 8);

  assert.equal(byRank.get(27).orbitId, 'tier2');
  assert.equal(byRank.get(27).promotion.targetOrbitId, 'tier3');
  assert.equal(byRank.get(27).promotion.targetRank, TOP5_LIMIT + 7);

  assert.equal(byRank.get(12).orbitId, 'tier3');
  assert.equal(byRank.get(12).promotion.targetOrbitId, 'top5');
  assert.equal(byRank.get(12).promotion.targetRank, TOP5_LIMIT);

  assert.equal(byRank.get(5).orbitId, 'top5');
  assert.equal(byRank.get(5).promotion.targetOrbitId, 'sun');
  assert.equal(byRank.get(5).promotion.targetRank, 1);
  assert.equal(byRank.get(5).promotion.progress, 20);
  assert.equal(byRank.get(2).promotion.progress, 80);
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
