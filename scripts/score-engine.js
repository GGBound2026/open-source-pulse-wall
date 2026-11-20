#!/usr/bin/env node

const STAR_POINTS = 1;
const CHEER_POINTS_CAP = 3;
const PAIR_POINTS_PER_PARTNER = 2;
const MAX_COAUTHORS_PER_COMMIT = 2;
const TOP5_LIMIT = 5;
const TOP5_MIN_POINTS = 1;

const VFX_TIER_THRESHOLDS = {
  starCard: 1,
  tier1: 3,
  tier2: 6,
  tier3: 10
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

function resolveVfxTier(points, starred) {
  const score = Math.max(0, Number(points) || 0);
  if (!starred) {
    return {
      vfxTier: 0,
      tierId: 'locked',
      tierLabel: '普通卡片',
      nextTierPoints: VFX_TIER_THRESHOLDS.starCard
    };
  }
  if (score >= VFX_TIER_THRESHOLDS.tier3) {
    return {
      vfxTier: 3,
      tierId: 'tier-3',
      tierLabel: '顶格传说',
      nextTierPoints: null
    };
  }
  if (score >= VFX_TIER_THRESHOLDS.tier2) {
    return {
      vfxTier: 2,
      tierId: 'tier-2',
      tierLabel: '二阶觉醒',
      nextTierPoints: VFX_TIER_THRESHOLDS.tier3
    };
  }
  if (score >= VFX_TIER_THRESHOLDS.tier1) {
    return {
      vfxTier: 1,
      tierId: 'tier-1',
      tierLabel: '一阶破框',
      nextTierPoints: VFX_TIER_THRESHOLDS.tier2
    };
  }
  return {
    vfxTier: 0,
    tierId: 'star-card',
    tierLabel: '星标闪卡',
    nextTierPoints: VFX_TIER_THRESHOLDS.tier1
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
    const tier = resolveVfxTier(points, starred);

    return {
      ...profile,
      score: {
        points,
        starred,
        ...tier,
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

  rankedIndices.forEach((entry, position) => {
    const rank = position + 1;
    const target = scored[entry.idx];
    target.score.rank = rank;
    target.score.isTop5 = Boolean(target.score.starred) && rank <= TOP5_LIMIT && target.score.points >= TOP5_MIN_POINTS;
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
  VFX_TIER_THRESHOLDS,
  parseCoAuthorsFromMessage,
  resolveVfxTier,
  computeContributorScores
};
