#!/usr/bin/env node

const STAR_POINTS = 1;
const CHEER_POINTS_CAP = 3;
const PAIR_POINTS_PER_PARTNER = 2;
const MAX_COAUTHORS_PER_COMMIT = 2;
const TOP5_LIMIT = 5;
const TOP5_MIN_POINTS = 1;

const TIER_PERCENTILE_CUTOFFS = {
  tier3: 0.15,
  tier2: 0.5
};

const PROMOTION_TARGETS = {
  unstarred: {
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
  },
  tier2: { targetOrbitId: 'tier2', targetLabel: '二阶 · 觉醒进化', targetHint: '前 50%' },
  tier3: { targetOrbitId: 'tier3', targetLabel: '三阶 · 顶格传说', targetHint: '前 15%' },
  top5: { targetOrbitId: 'top5', targetLabel: 'TOP 2–5 内环', targetHint: '恒星近卫' },
  sun: { targetOrbitId: 'sun', targetLabel: '#1 恒星王座', targetHint: '榜首' }
};

function extractGithubLoginFromEmail(email) {
  const raw = String(email || '').trim().toLowerCase();
  if (!raw) return '';
  const noreplyMatch = /^(?:\d+\+)?([a-z0-9-]+)@users\.noreply\.github\.com$/i.exec(raw);
  if (noreplyMatch) return noreplyMatch[1].toLowerCase();
  return '';
}

function parseCoAuthorsFromMessage(message) {
  const text = String(message || '');
  if (!text) return [];
  const entries = [];
  const regex = /^[ \t]*Co-authored-by:[ \t]*(.+?)[ \t]*<([^>]+)>[ \t]*$/gmi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    entries.push({
      name: String(match[1] || '').trim(),
      email: String(match[2] || '').trim()
    });
  }
  return entries;
}

function resolveHandleFromIdentity(identity, { handleSet, uniqueNameMap }) {
  if (!identity) return '';
  const directLogin = String(identity.login || '').trim().replace(/^@/, '').toLowerCase();
  if (directLogin && handleSet.has(directLogin)) return directLogin;

  const emailLogin = extractGithubLoginFromEmail(identity.email);
  if (emailLogin && handleSet.has(emailLogin)) return emailLogin;

  const rawName = String(identity.name || '').trim().replace(/^@/, '').toLowerCase();
  if (rawName && handleSet.has(rawName)) return rawName;
  if (rawName && uniqueNameMap.has(rawName)) return uniqueNameMap.get(rawName);

  const emailRaw = String(identity.email || '').trim().toLowerCase();
  const atIndex = emailRaw.indexOf('@');
  if (atIndex > 0) {
    const localPart = emailRaw.slice(0, atIndex);
    if (handleSet.has(localPart)) return localPart;
  }

  return '';
}

/**
 * Compute post-Top5 pool rank cutoffs for Tier 3 and Tier 2.
 * Falls back cleanly on small pools (M <= 2) so no tier is skipped and last place isn't Tier 3.
 */
function computeTierCutoffs(poolSize) {
  const M = Math.max(0, Math.floor(Number(poolSize) || 0));
  if (M <= 1) {
    return { tier3End: 0, tier2End: 0 };
  }
  if (M === 2) {
    return { tier3End: 0, tier2End: 1 };
  }
  const tier3End = Math.max(1, Math.ceil(M * TIER_PERCENTILE_CUTOFFS.tier3));
  const tier2End = Math.max(tier3End + 1, Math.ceil(M * TIER_PERCENTILE_CUTOFFS.tier2));
  return { tier3End, tier2End };
}

/**
 * Resolve orbit and VFX tier metadata from a contributor's starred status and leaderboard rank.
 */
function resolveRankTier({ starred = false, rank = 0, starredCount = 0 } = {}) {
  const safeRank = Math.floor(Number(rank) || 0);
  const safeStarredCount = Math.max(0, Math.floor(Number(starredCount) || 0));
  const poolSize = Math.max(0, safeStarredCount - TOP5_LIMIT);

  if (!starred || safeRank <= 0 || safeStarredCount <= 0) {
    return {
      vfxTier: 0,
      orbitId: 'outer',
      tierId: 'locked',
      tierLabel: '未点 Star',
      tierShort: '',
      poolRank: null,
      poolSize,
      poolPercentile: null,
      rankPercentile: null
    };
  }

  const rankPercentile = Math.round((safeRank / safeStarredCount) * 1000) / 10;

  if (safeRank === 1) {
    return {
      vfxTier: 3,
      orbitId: 'sun',
      tierId: 'sun',
      tierLabel: '恒星王座',
      tierShort: '王座',
      poolRank: null,
      poolSize,
      poolPercentile: null,
      rankPercentile
    };
  }

  if (safeRank >= 2 && safeRank <= TOP5_LIMIT) {
    return {
      vfxTier: 3,
      orbitId: 'top5',
      tierId: 'top-5',
      tierLabel: '恒星近卫',
      tierShort: '近卫',
      poolRank: null,
      poolSize,
      poolPercentile: null,
      rankPercentile
    };
  }

  const { tier3End, tier2End } = computeTierCutoffs(poolSize);
  const poolRank = safeRank - TOP5_LIMIT;
  const poolPercentile = poolSize > 0 ? Math.round((poolRank / poolSize) * 1000) / 10 : null;

  if (poolRank <= tier3End) {
    return {
      vfxTier: 3,
      orbitId: 'tier3',
      tierId: 'tier-3',
      tierLabel: '三阶 · 顶格传说',
      tierShort: '三阶',
      poolRank,
      poolSize,
      poolPercentile,
      rankPercentile
    };
  }

  if (poolRank <= tier2End) {
    return {
      vfxTier: 2,
      orbitId: 'tier2',
      tierId: 'tier-2',
      tierLabel: '二阶 · 觉醒进化',
      tierShort: '二阶',
      poolRank,
      poolSize,
      poolPercentile,
      rankPercentile
    };
  }

  return {
    vfxTier: 1,
    orbitId: 'tier1',
    tierId: 'tier-1',
    tierLabel: '一阶 · 初醒破框',
    tierShort: '一阶',
    poolRank,
    poolSize,
    poolPercentile,
    rankPercentile
  };
}

/**
 * Compute next-orbit promotion targets, rank/point gaps, and smooth tier progress [0..100].
 */
function computePromotion({ starred, rank, points, orbitId, starredCount, cutoffs, rankedStarred }) {
  if (!starred || rank <= 0 || starredCount <= 0) {
    return { ...PROMOTION_TARGETS.unstarred };
  }

  if (orbitId === 'sun') {
    const runnerUp = rankedStarred[1];
    return {
      targetOrbitId: null,
      targetLabel: null,
      targetHint: null,
      targetRank: 1,
      ranksNeeded: 0,
      thresholdPoints: points,
      pointsToTie: 0,
      pointsToPass: 0,
      leadPoints: runnerUp ? Math.max(0, points - runnerUp.score.points) : points,
      progress: 100
    };
  }

  const { tier3End, tier2End } = cutoffs;
  const top5Edge = Math.min(TOP5_LIMIT, starredCount);
  let descriptor;

  if (orbitId === 'tier1') {
    const targetMeta = tier2End > 0 ? PROMOTION_TARGETS.tier2 : PROMOTION_TARGETS.top5;
    const targetRank = tier2End > 0 ? TOP5_LIMIT + tier2End : top5Edge;
    descriptor = {
      ...targetMeta,
      targetRank,
      tierTop: TOP5_LIMIT + tier2End + 1,
      tierBottomSlot: starredCount,
      tierBottom: starredCount
    };
  } else if (orbitId === 'tier2') {
    const targetMeta = tier3End > 0 ? PROMOTION_TARGETS.tier3 : PROMOTION_TARGETS.top5;
    const targetRank = tier3End > 0 ? TOP5_LIMIT + tier3End : top5Edge;
    descriptor = {
      ...targetMeta,
      targetRank,
      tierTop: TOP5_LIMIT + tier3End + 1,
      tierBottomSlot: TOP5_LIMIT + tier2End,
      tierBottom: TOP5_LIMIT + tier2End + 1
    };
  } else if (orbitId === 'tier3') {
    descriptor = {
      ...PROMOTION_TARGETS.top5,
      targetRank: TOP5_LIMIT,
      tierTop: TOP5_LIMIT + 1,
      tierBottomSlot: TOP5_LIMIT + tier3End,
      tierBottom: TOP5_LIMIT + tier3End + 1
    };
  } else {
    descriptor = {
      ...PROMOTION_TARGETS.sun,
      targetRank: 1,
      tierTop: 2,
      tierBottomSlot: top5Edge,
      tierBottom: top5Edge + 1
    };
  }

  const gatekeeper = rankedStarred[descriptor.targetRank - 1];
  const thresholdPoints = gatekeeper ? gatekeeper.score.points : points;
  const ranksNeeded = Math.max(1, rank - descriptor.targetRank);
  const pointsToTie = Math.max(0, thresholdPoints - points);
  const pointsToPass = Math.max(1, thresholdPoints - points + 1);
  const singleSlotTier = descriptor.tierTop >= descriptor.tierBottomSlot;
  const span = Math.max(1, descriptor.tierBottom - descriptor.targetRank);
  const rawPct = ((descriptor.tierBottom - rank) / span) * 100;
  const progress = singleSlotTier ? 96 : Math.min(96, Math.max(8, Math.round(rawPct)));

  return {
    targetOrbitId: descriptor.targetOrbitId,
    targetLabel: descriptor.targetLabel,
    targetHint: descriptor.targetHint,
    targetRank: descriptor.targetRank,
    ranksNeeded,
    thresholdPoints,
    pointsToTie,
    pointsToPass,
    leadPoints: 0,
    progress
  };
}

function computeContributorScores({
  contributors = [],
  commits = []
} = {}) {
  const handleSet = new Set();
  const displayHandleByKey = new Map();
  const nameCounts = new Map();
  const nameToKey = new Map();

  for (const profile of contributors) {
    const handle = String(profile.github || '').trim();
    const key = handle.toLowerCase();
    if (!key) continue;
    handleSet.add(key);
    displayHandleByKey.set(key, handle);
    const displayName = String(profile.name || '').trim().toLowerCase();
    if (displayName) {
      nameCounts.set(displayName, (nameCounts.get(displayName) || 0) + 1);
      nameToKey.set(displayName, key);
    }
  }

  const uniqueNameMap = new Map();
  for (const [nameKey, count] of nameCounts.entries()) {
    if (count === 1) uniqueNameMap.set(nameKey, nameToKey.get(nameKey));
  }

  // 1) Cheers sent: +1 per distinct classmate cheered (max 3)
  const cheeredTargetsByUser = new Map();
  for (const targetProfile of contributors) {
    const targetKey = String(targetProfile.github || '').trim().toLowerCase();
    if (!targetKey) continue;
    const cheers = Array.isArray(targetProfile.cheers) ? targetProfile.cheers : [];
    for (const cheer of cheers) {
      const fromKey = String(cheer?.from || '').trim().toLowerCase();
      const message = String(cheer?.message || '').trim();
      if (!fromKey || !message || fromKey === targetKey) continue;
      if (!cheeredTargetsByUser.has(fromKey)) cheeredTargetsByUser.set(fromKey, new Set());
      cheeredTargetsByUser.get(fromKey).add(targetKey);
    }
  }

  // 2) Pair programming via Co-authored-by on valid main commits (+2 per distinct partner; each pair counted once)
  const pairPartnersByUser = new Map();
  const recordPair = (aKey, bKey) => {
    if (!aKey || !bKey || aKey === bKey) return;
    if (!handleSet.has(aKey) || !handleSet.has(bKey)) return;
    if (!pairPartnersByUser.has(aKey)) pairPartnersByUser.set(aKey, new Set());
    if (!pairPartnersByUser.has(bKey)) pairPartnersByUser.set(bKey, new Set());
    pairPartnersByUser.get(aKey).add(bKey);
    pairPartnersByUser.get(bKey).add(aKey);
  };

  for (const commit of Array.isArray(commits) ? commits : []) {
    if (!commit || typeof commit !== 'object') continue;
    // Anti-abuse: reject empty commits & unmerged PRs
    if (typeof commit.changedFiles === 'number' && commit.changedFiles <= 0) continue;
    if (commit.prMerged === false) continue;

    const fullMessage = String(commit.fullMessage || commit.message || '');
    const messageCoAuthors = parseCoAuthorsFromMessage(fullMessage);
    const graphAuthors = Array.isArray(commit.authors) ? commit.authors : [];

    // Must actually have a co-author signal (either >= 2 GraphQL authors or explicit Co-authored-by trailer)
    const hasCoAuthorSignal = messageCoAuthors.length > 0 || graphAuthors.length >= 2;
    if (!hasCoAuthorSignal) continue;

    let primaryHandle = resolveHandleFromIdentity(
      {
        login: commit.author,
        email: commit.authorEmail,
        name: commit.authorName
      },
      { handleSet, uniqueNameMap }
    );
    if (!primaryHandle && graphAuthors.length > 0) {
      primaryHandle = resolveHandleFromIdentity(graphAuthors[0], { handleSet, uniqueNameMap });
    }
    if (!primaryHandle) continue;

    const coAuthors = new Set();
    for (const ga of graphAuthors) {
      const resolved = resolveHandleFromIdentity(ga, { handleSet, uniqueNameMap });
      if (resolved && resolved !== primaryHandle) coAuthors.add(resolved);
    }

    for (const ca of messageCoAuthors) {
      const resolved = resolveHandleFromIdentity(ca, { handleSet, uniqueNameMap });
      if (resolved && resolved !== primaryHandle) coAuthors.add(resolved);
    }

    // Anti-abuse: ignore commits listing too many co-authors (mass-tagging farm) and only pair primary <-> co-author
    if (coAuthors.size === 0 || coAuthors.size > MAX_COAUTHORS_PER_COMMIT) continue;

    for (const partner of coAuthors) {
      recordPair(primaryHandle, partner);
    }
  }

  // 3) Combine per-contributor score & rank
  const scored = contributors.map((profile) => {
    const key = String(profile.github || '').trim().toLowerCase();
    const starred = Boolean(profile.starred);
    const starPts = starred ? STAR_POINTS : 0;

    const cheerTargets = Array.from(cheeredTargetsByUser.get(key) || [])
      .map((t) => displayHandleByKey.get(t) || t)
      .sort((a, b) => a.localeCompare(b));
    const cheerPts = Math.min(CHEER_POINTS_CAP, cheerTargets.length);

    const pairPartners = Array.from(pairPartnersByUser.get(key) || [])
      .map((p) => displayHandleByKey.get(p) || p)
      .sort((a, b) => a.localeCompare(b));
    const pairPts = pairPartners.length * PAIR_POINTS_PER_PARTNER;

    const points = starPts + cheerPts + pairPts;

    return {
      ...profile,
      score: {
        points,
        starred,
        rank: 0,
        isTop5: false,
        breakdown: {
          star: starPts,
          cheers: cheerPts,
          cheerTargets,
          pair: pairPts,
          pairPartners
        }
      }
    };
  });

  // Compute leaderboard rank & Top 5 (requires Star + >= 1 point)
  const rankedIndices = scored
    .map((profile, idx) => ({
      idx,
      points: profile.score.points,
      starred: profile.score.starred ? 1 : 0,
      cheersSent: profile.score.breakdown.cheerTargets.length,
      cheersReceived: Array.isArray(profile.cheers) ? profile.cheers.length : 0,
      joinedTs: Date.parse(profile.joinedAt || '') || Number.POSITIVE_INFINITY,
      handle: String(profile.github || '').toLowerCase()
    }))
    .sort((a, b) => {
      if (b.starred !== a.starred) return b.starred - a.starred;
      if (b.points !== a.points) return b.points - a.points;
      if (b.cheersSent !== a.cheersSent) return b.cheersSent - a.cheersSent;
      if (b.cheersReceived !== a.cheersReceived) return b.cheersReceived - a.cheersReceived;
      if (a.joinedTs !== b.joinedTs) return a.joinedTs - b.joinedTs;
      return a.handle.localeCompare(b.handle);
    });

  const rankedStarred = [];
  rankedIndices.forEach((entry) => {
    const target = scored[entry.idx];
    if (target.score.starred) rankedStarred.push(target);
  });

  const starredCount = rankedStarred.length;
  const poolSize = Math.max(0, starredCount - TOP5_LIMIT);
  const cutoffs = computeTierCutoffs(poolSize);

  rankedIndices.forEach((entry, position) => {
    const rank = position + 1;
    const target = scored[entry.idx];
    const isTop5 = Boolean(target.score.starred) && rank <= TOP5_LIMIT && target.score.points >= TOP5_MIN_POINTS;
    const tier = resolveRankTier({
      starred: target.score.starred,
      rank,
      starredCount
    });
    const promotion = computePromotion({
      starred: target.score.starred,
      rank,
      points: target.score.points,
      orbitId: tier.orbitId,
      starredCount,
      cutoffs,
      rankedStarred
    });

    target.score = {
      ...target.score,
      ...tier,
      starredTotal: starredCount,
      nextTierPoints: null,
      rank,
      isTop5,
      promotion
    };
  });

  return {
    contributors: scored
  };
}

module.exports = {
  STAR_POINTS,
  CHEER_POINTS_CAP,
  PAIR_POINTS_PER_PARTNER,
  MAX_COAUTHORS_PER_COMMIT,
  TOP5_LIMIT,
  TOP5_MIN_POINTS,
  TIER_PERCENTILE_CUTOFFS,
  parseCoAuthorsFromMessage,
  computeTierCutoffs,
  resolveRankTier,
  computeContributorScores
};
