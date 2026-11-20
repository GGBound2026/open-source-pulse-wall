const MAX_FEED_ITEMS = 30;
const VISIBLE_FEED_ITEMS = 3;
const REFRESH_LABEL_DEFAULT = '立即刷新';
const STATE_CACHE_KEY = 'pulse-wall:state:v5';
const REFRESH_COOLDOWN_STORAGE_KEY = 'pulse-wall:refresh-cooldown-until';
const MOTION_PREF_STORAGE_KEY = 'pulse-wall:motion-paused';
const FRESH_WINDOW_MS = 20 * 60 * 1000;
const SESSION_FRESH_TTL_MS = 95 * 1000;

// Dimension 1: Card Collector Material Palette (8 themes)
const STAR_THEMES = [
  { id: 'prism', label: '棱镜虹彩', tone: 'light' },
  { id: 'goldleaf', label: '鎏金典藏', tone: 'light' },
  { id: 'aurora', label: '翡翠极光', tone: 'dark' },
  { id: 'sakura', label: '落樱玫瑰金', tone: 'light' },
  { id: 'celestial', label: '午夜星穹', tone: 'dark' },
  { id: 'opalescent', label: '月白欧泊', tone: 'light' },
  { id: 'amber', label: '琥珀鎏铜', tone: 'light' },
  { id: 'obsidian', label: '黑曜紫晶', tone: 'dark' }
];

// Dimension 2: 12 Distinct Mythic & Multi-Element Frame-Break Lineages (each with its own iconic native palette!)
// Tier 0 (1-2 pts, Starred): Collector card skin only, ZERO frame-break VFX (teases destined lineage)
// Tier 1 (3-5 pts): Hatchling / Initiate form
// Tier 2 (6-9 pts): Awakened / Adult form
// Tier 3 (10+ pts): Sovereign / Epic form with live neighbor-card interaction
const STAR_VFX_BY_TIER = {
  1: [
    { id: 'dragon-summon', lineage: '炎龙血脉', label: '小火龙幼崽' },
    { id: 'hero-slays-dragon', lineage: '勇者屠龙', label: '见习勇者斩幼龙' },
    { id: 'seraph-descent', lineage: '炽天使降临', label: '圣羽微光' },
    { id: 'abyss-demon', lineage: '深渊魔王', label: '深渊魔爪' },
    { id: 'thunder-zeus', lineage: '雷神裁决', label: '高压鞭雷' },
    { id: 'paladin-cavalry', lineage: '圣殿骑士团', label: '孤骑突刺' },
    { id: 'sword-immortal', lineage: '青莲剑仙', label: '御剑初成' },
    { id: 'ink-dragon', lineage: '泼墨神龙', label: '墨蛟戏珠' },
    { id: 'nine-tail-fox', lineage: '九尾天狐', label: '灵狐探首' },
    { id: 'frost-fenrir', lineage: '极地冰狼', label: '雪狼踏霜' },
    { id: 'arcane-cosmos', lineage: '星界天象', label: '学徒星环' },
    { id: 'kunpeng-whale', lineage: '逍遥鲲鹏', label: '灵鲲跃浪' }
  ],
  2: [
    { id: 'dragon-summon', lineage: '炎龙血脉', label: '炽翼飞龙' },
    { id: 'hero-slays-dragon', lineage: '勇者屠龙', label: '圣剑骑士破魔龙' },
    { id: 'seraph-descent', lineage: '炽天使降临', label: '四翼圣使天降' },
    { id: 'abyss-demon', lineage: '深渊魔王', label: '炎魔角影降世' },
    { id: 'thunder-zeus', lineage: '雷神裁决', label: '雷神战锤轰鸣' },
    { id: 'paladin-cavalry', lineage: '圣殿骑士团', label: '圆桌圣盾与双骑' },
    { id: 'sword-immortal', lineage: '青莲剑仙', label: '青莲五剑阵' },
    { id: 'ink-dragon', lineage: '泼墨神龙', label: '泼墨神龙腾渊' },
    { id: 'nine-tail-fox', lineage: '九尾天狐', label: '三尾妖狐幻舞' },
    { id: 'frost-fenrir', lineage: '极地冰狼', label: '凛冬冰狼啸月' },
    { id: 'arcane-cosmos', lineage: '星界天象', label: '大法师星象天陨' },
    { id: 'kunpeng-whale', lineage: '逍遥鲲鹏', label: '巨鲲巡海' }
  ],
  3: [
    { id: 'dragon-summon', lineage: '炎龙血脉', label: '焚天古龙王' },
    { id: 'hero-slays-dragon', lineage: '勇者屠龙', label: '圣光斩穹 · 屠龙史诗' },
    { id: 'seraph-descent', lineage: '炽天使降临', label: '六翼炽天使 · 众卡圣咏' },
    { id: 'abyss-demon', lineage: '深渊魔王', label: '深渊魔君 · 锁链吞噬' },
    { id: 'thunder-zeus', lineage: '雷神裁决', label: '万雷电网 · 连锁感电' },
    { id: 'paladin-cavalry', lineage: '圣殿骑士团', label: '圣殿骑兵总攻' },
    { id: 'sword-immortal', lineage: '青莲剑仙', label: '万剑归宗' },
    { id: 'ink-dragon', lineage: '泼墨神龙', label: '九霄墨龙巡界' },
    { id: 'nine-tail-fox', lineage: '九尾天狐', label: '九尾天狐魅影' },
    { id: 'frost-fenrir', lineage: '极地冰狼', label: '芬里尔极光冰原' },
    { id: 'arcane-cosmos', lineage: '星界天象', label: '诸神黄昏 · 星界禁咒' },
    { id: 'kunpeng-whale', lineage: '逍遥鲲鹏', label: '化鲲为鹏 · 扶摇九万里' }
  ]
};

const STAR_VFX = STAR_VFX_BY_TIER[2];

// Dimension 3: VFX Energy Spectrum Palette (8 high-contrast light/dark-paper spectra)
const STAR_SPECTRA = [
  { id: 'cyan-volt', label: '星蓝雷电' },
  { id: 'solar-gold', label: '炽日鎏金' },
  { id: 'emerald-jade', label: '翡翠极光' },
  { id: 'sakura-neon', label: '绯樱粉金' },
  { id: 'prism-rainbow', label: '全息虹彩' },
  { id: 'amethyst-void', label: '虚空紫晶' },
  { id: 'crimson-ember', label: '绯红余烬' },
  { id: 'frost-opal', label: '冰川月白' }
];

// Dimension 4: Surface Vector Watermark Pattern (8 patterns)
const STAR_PATTERNS = [
  { id: 'constellation', label: '星图连线' },
  { id: 'sunburst', label: '破晓芒光' },
  { id: 'botanical', label: '鎏金叶脉' },
  { id: 'nebula-rings', label: '星轨同心环' },
  { id: 'sacred-geo', label: '菱格星纹' },
  { id: 'aurora-waves', label: '流云光带' },
  { id: 'compass-rose', label: '航海星盘' },
  { id: 'prism-facets', label: '晶格折面' }
];

// Dimension 5: Overhanging Corner Star Emblem (8 emblems)
const STAR_BADGES = [
  { id: 'crystal-star', label: '水晶棱镜星' },
  { id: 'wax-seal', label: '复古火漆印' },
  { id: 'shooting-star', label: '璀璨流星章' },
  { id: 'crescent-crest', label: '新月星辰章' },
  { id: 'ribbon-medal', label: '丝带星勋章' },
  { id: 'enamel-charm', label: '珐琅星挂坠' },
  { id: 'prism-diamond', label: '八芒星菱钻' },
  { id: 'laurel-star', label: '月桂星冠章' }
];

const TOTAL_STAR_COMBINATIONS =
  STAR_THEMES.length *
  STAR_VFX.length *
  STAR_SPECTRA.length *
  STAR_PATTERNS.length *
  STAR_BADGES.length;

const state = {
  knownHandles: new Set(),
  knownGithubEvents: new Set(),
  knownCheerKeys: new Set(),
  knownStarredHandles: new Set(),
  knownTiersByHandle: new Map(),
  freshnessByHandle: new Map(),
  bootstrappedCheers: false,
  bootstrappedStars: false,
  bootstrappedTiers: false,
  demoFreshSeeded: false,
  freshnessCleanupTimer: null,
  honorSpotlightTimer: null,
  feed: [],
  lastOk: null,
  lastFingerprint: '',
  lastPayloadTime: 0,
  fallbackTimer: null,
  dataMode: '',
  activityReturnFocus: null,
  cheersReturnFocus: null,
  wallContributors: [],
  wallFilter: 'all',
  starRecipes: new Map(),
  stargazerSet: new Set(),
  githubHtmlUrl: '',
  githubDefaultBranch: 'main',
  refreshing: false,
  refreshCooldownTimer: null,
  commitRankByAuthor: new Map(),
  motionPaused: false,
  vfxEngine: null
};

const AVATARS = Array.from({ length: 11 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `avatars/avatar-${number}.png`;
});
const AVATAR_WARNING_FALLBACK = 'avatars/avatar-warning.svg';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const elements = {
  connectionDot: $('#connectionDot'),
  connectionText: $('#connectionText'),
  starCount: $('#starCount'),
  starBadgeLink: $('#starBadgeLink'),
  statCount: $('#statCount'),
  statCountNote: $('#statCountNote'),
  statCardCount: $('#statCardCount'),
  statValidation: $('#statValidation'),
  statStacks: $('#statStacks'),
  statPulse: $('#statPulse'),
  statCardPulse: $('#statCardPulse'),
  statIssues: $('#statIssues'),
  statIssuesNote: $('#statIssuesNote'),
  statCardIssues: $('#statCardIssues'),
  statReview: $('#statReview'),
  statReviewNote: $('#statReviewNote'),
  statCardReview: $('#statCardReview'),
  validationBox: $('#validationBox'),
  liveFeed: $('#liveFeed'),
  wall: $('#contributorsWall'),
  wallViewport: $('.wall-scroll-viewport'),
  honorRibbon: $('#honorRibbon'),
  honorRibbonList: $('#honorRibbonList'),
  honorRibbonHint: $('#honorRibbonHint'),
  honorRibbonHintText: $('#honorRibbonHintText'),
  vfxOverlay: $('#vfxOverlay'),
  toast: $('#toast'),
  viewAllFeed: $('#viewAllFeed'),
  activityOverlay: $('#activityOverlay'),
  activityPanel: $('#activityPanel'),
  activityList: $('#activityList'),
  activityCount: $('#activityCount'),
  closeActivity: $('#closeActivity'),
  cheersOverlay: $('#cheersOverlay'),
  cheersPanel: $('#cheersPanel'),
  cheersTitle: $('#cheersTitle'),
  cheersSubtitle: $('#cheersSubtitle'),
  cheersFullList: $('#cheersFullList'),
  closeCheers: $('#closeCheers'),
  wallSummary: $('#wallSummary'),
  wallSearch: $('#wallSearch'),
  clearWallSearch: $('#clearWallSearch'),
  toggleWallMotion: $('#toggleWallMotion'),
  refreshWall: $('#refreshWall'),
  refreshWallLabel: $('#refreshWallLabel'),
  openTopRepo: $('#openTopRepo')
};

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatTime(iso) {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return '刚刚';

  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h前`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}天前`;

  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function toast(message, duration = 2800) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => elements.toast.classList.remove('show'), duration);
}

function hashString(input, seed = 2166136261) {
  let hash = seed >>> 0;
  const text = String(input || '');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function demoStarsEnabled() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo-stars') === '1' || params.get('demo-tiers') === '1';
  } catch {
    return false;
  }
}

function demoTiersEnabled() {
  try {
    return new URLSearchParams(window.location.search).get('demo-tiers') === '1';
  } catch {
    return false;
  }
}

function resolveTierMeta(points, starred) {
  const score = Math.max(0, Number(points) || 0);
  if (!starred) return { vfxTier: 0, tierId: 'locked', tierLabel: '未点 Star', tierShort: '', nextTierPoints: 1 };
  if (score >= 10) return { vfxTier: 3, tierId: 'tier-3', tierLabel: '三阶 · 顶格传说', tierShort: '三阶', nextTierPoints: null };
  if (score >= 6) return { vfxTier: 2, tierId: 'tier-2', tierLabel: '二阶 · 觉醒进化', tierShort: '二阶', nextTierPoints: 10 };
  if (score >= 3) return { vfxTier: 1, tierId: 'tier-1', tierLabel: '一阶 · 初醒破框', tierShort: '一阶', nextTierPoints: 6 };
  return { vfxTier: 0, tierId: 'star-card', tierLabel: '0阶 · 星标闪卡', tierShort: '0阶', nextTierPoints: 3 };
}

function buildFallbackScoresMap(contributors) {
  const sentByUser = new Map();
  for (const target of contributors) {
    const targetKey = String(target.github || '').trim().toLowerCase();
    if (!targetKey) continue;
    for (const cheer of Array.isArray(target.cheers) ? target.cheers : []) {
      const fromKey = String(cheer?.from || '').trim().toLowerCase();
      if (!fromKey || !String(cheer?.message || '').trim() || fromKey === targetKey) continue;
      if (!sentByUser.has(fromKey)) sentByUser.set(fromKey, new Set());
      sentByUser.get(fromKey).add(targetKey);
    }
  }
  return sentByUser;
}

function scoreForProfile(profile, fallbackCheersMap = null, demoSlot = -1) {
  const starred = isProfileStarred(profile);
  if (demoTiersEnabled() && starred && demoSlot >= 0) {
    const demoPointsPool = [12, 10, 8, 6, 5, 4, 3, 2, 1];
    const pts = demoSlot < demoPointsPool.length ? demoPointsPool[demoSlot] : 1;
    const meta = resolveTierMeta(pts, true);
    const cheerPts = Math.min(3, Math.max(0, pts - 1));
    const rem = Math.max(0, pts - 1 - cheerPts);
    const pairPts = Math.min(6, Math.floor(rem / 2) * 2);
    const relicPts = Math.max(0, rem - pairPts);
    return {
      points: pts,
      starred: true,
      ...meta,
      rank: demoSlot + 1,
      isTop5: pts >= 5 && demoSlot < 5,
      breakdown: {
        star: 1,
        cheers: cheerPts,
        cheerTargets: [],
        pair: pairPts,
        pairPartners: [],
        relic: relicPts,
        relicIds: [],
        relicLate: []
      }
    };
  }

  if (profile?.score && typeof profile.score.points === 'number') {
    const meta = resolveTierMeta(profile.score.points, starred);
    return {
      ...profile.score,
      starred,
      ...meta
    };
  }

  const key = String(profile.github || profile.file || profile.name || '').trim().toLowerCase();
  const starPts = starred ? 1 : 0;
  const sentTargets = fallbackCheersMap ? Array.from(fallbackCheersMap.get(key) || []) : [];
  const cheerPts = Math.min(3, sentTargets.length);
  const points = starPts + cheerPts;
  const meta = resolveTierMeta(points, starred);
  return {
    points,
    starred,
    ...meta,
    rank: 0,
    isTop5: false,
    breakdown: {
      star: starPts,
      cheers: cheerPts,
      cheerTargets: sentTargets,
      pair: 0,
      pairPartners: [],
      relic: 0,
      relicIds: [],
      relicLate: []
    }
  };
}

function formatScoreBreakdownText(score) {
  const b = score?.breakdown || {};
  const parts = [];
  if (b.star) parts.push(`⭐Star +${b.star}`);
  if (b.cheers) parts.push(`💬寄语 +${b.cheers}`);
  if (b.pair) parts.push(`🤝结对 +${b.pair}`);
  if (b.relic) parts.push(`🔍寻宝 +${b.relic}`);
  return parts.length ? parts.join(' · ') : '尚未获得积分';
}

function isProfileStarred(profile) {
  if (profile.starred === true) return true;
  const handle = String(profile.github || '').trim().toLowerCase();
  if (handle && state.stargazerSet.has(handle)) return true;
  if (demoStarsEnabled()) {
    const key = handle || String(profile.file || profile.name || '').toLowerCase();
    return hashString(key, 0x9e3779b9) % 10 < 6;
  }
  return false;
}

function buildRecipeFromIndices(seedKey, indices, scoreInfo) {
  const theme = STAR_THEMES[indices[0]];
  const vfxTier = scoreInfo.vfxTier;
  const lineageSlot = indices[1] % STAR_VFX.length;
  const destinedTier1 = STAR_VFX_BY_TIER[1][lineageSlot];
  const tierPool = STAR_VFX_BY_TIER[vfxTier] || null;
  const vfx = tierPool ? tierPool[lineageSlot] : null;
  const spectrum = STAR_SPECTRA[indices[2]];
  const pattern = STAR_PATTERNS[indices[3]];
  const badge = STAR_BADGES[indices[4]];
  const codeHash = hashString(`${seedKey}:${indices.join('-')}`, 0x811c9dc5);
  const serial = (codeHash & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const hueShift = ((codeHash >>> 16) % 25) - 12;
  const sparkSeed = (codeHash >>> 24) % 100;

  const skinSummary = `${theme.label} × ${pattern.label} × ${badge.label}`;
  const summary = vfx
    ? `${vfx.lineage}·${vfx.label}（${scoreInfo.tierLabel}）× ${spectrum.label} × ${skinSummary}`
    : `隐藏血脉「${destinedTier1.lineage}·${destinedTier1.label}」（3分唤醒）× ${skinSummary}`;

  return {
    key: indices.join(':'),
    serial,
    uid: `${serial.toLowerCase()}-${indices.join('')}`,
    theme,
    vfxTier,
    vfx,
    destinedLineage: destinedTier1,
    spectrum,
    pattern,
    badge,
    score: scoreInfo,
    hueShift,
    sparkSeed,
    skinSummary,
    summary
  };
}

function pickLeastUsedIndex(preferred, size, stepSeed, counts) {
  let minCount = Infinity;
  for (let i = 0; i < size; i += 1) {
    if (counts[i] < minCount) minCount = counts[i];
  }
  if (counts[preferred] === minCount) return preferred;

  const stride = (stepSeed % (size - 1)) + 1;
  for (let probe = 1; probe < size; probe += 1) {
    const candidate = (preferred + probe * stride) % size;
    if (counts[candidate] === minCount) return candidate;
  }
  for (let i = 0; i < size; i += 1) {
    const candidate = (preferred + i) % size;
    if (counts[candidate] === minCount) return candidate;
  }
  return preferred;
}

function assignStarRecipes(contributors) {
  const map = new Map();
  const scoreMap = new Map();
  const usedCombos = new Set();
  const fallbackCheersMap = buildFallbackScoresMap(contributors);
  const sizes = [
    STAR_THEMES.length,
    STAR_VFX.length,
    STAR_SPECTRA.length,
    STAR_PATTERNS.length,
    STAR_BADGES.length
  ];
  const dimCounts = sizes.map((size) => new Array(size).fill(0));
  const tierVfxCounts = {
    1: new Array(STAR_VFX.length).fill(0),
    2: new Array(STAR_VFX.length).fill(0),
    3: new Array(STAR_VFX.length).fill(0)
  };

  const ordered = contributors
    .slice()
    .sort((a, b) => String(a.github || a.file || a.name).toLowerCase().localeCompare(
      String(b.github || b.file || b.name).toLowerCase()
    ));

  let demoStarSlot = 0;
  for (const profile of ordered) {
    const key = String(profile.github || profile.file || profile.name || '').trim().toLowerCase();
    if (!key) continue;
    const starred = isProfileStarred(profile);
    const slot = starred ? demoStarSlot++ : -1;
    const scoreInfo = scoreForProfile(profile, fallbackCheersMap, slot);
    scoreMap.set(key, scoreInfo);

    // Hard gate: MUST Star the repo to unlock Star Collector Card skin & VFX!
    if (!starred) continue;

    const h1 = hashString(key, 0x811c9dc5);
    const h2 = hashString(`${key}#pulse-star`, 0x9e3779b9);
    const h3 = hashString(`wall:${key}:aura`, 0x85ebca6b);

    const preferred = [
      h1 % sizes[0],
      (h1 >>> 8) % sizes[1],
      h2 % sizes[2],
      (h2 >>> 10) % sizes[3],
      h3 % sizes[4]
    ];
    const stepSeeds = [
      (h1 >>> 16),
      (h2 >>> 16),
      (h3 >>> 8),
      (h3 >>> 16),
      (h1 >>> 24)
    ];

    let indices = [
      pickLeastUsedIndex(preferred[0], sizes[0], stepSeeds[0], dimCounts[0]),
      pickLeastUsedIndex(preferred[1], sizes[1], stepSeeds[1], dimCounts[1]),
      pickLeastUsedIndex(preferred[2], sizes[2], stepSeeds[2], dimCounts[2]),
      pickLeastUsedIndex(preferred[3], sizes[3], stepSeeds[3], dimCounts[3]),
      pickLeastUsedIndex(preferred[4], sizes[4], stepSeeds[4], dimCounts[4])
    ];

    let attempt = 0;
    while (usedCombos.has(indices.join(':')) && attempt < 256) {
      attempt += 1;
      const dim = attempt % 5;
      indices = indices.slice();
      indices[dim] = (indices[dim] + 1) % sizes[dim];
    }

    usedCombos.add(indices.join(':'));
    dimCounts[0][indices[0]] += 1;
    dimCounts[1][indices[1]] += 1;
    dimCounts[2][indices[2]] += 1;
    dimCounts[3][indices[3]] += 1;
    dimCounts[4][indices[4]] += 1;

    map.set(key, buildRecipeFromIndices(key, indices, scoreInfo));
  }

  state.starRecipes = map;
  state.profileScores = scoreMap;
}

function getProfileScore(profile) {
  const key = String(profile.github || profile.file || profile.name || '').trim().toLowerCase();
  return (key && state.profileScores?.get(key)) || scoreForProfile(profile);
}

function recipeForProfile(profile) {
  const key = String(profile.github || profile.file || profile.name || '').trim().toLowerCase();
  if (!key) return null;
  return state.starRecipes.get(key) || null;
}

const EVENT_ICON_PATHS = {
  star: '<path d="m12 2.8 2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93Z" />',
  cheer: '<path d="M5 6h11a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3l-4 3v-3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z" />',
  issue_opened: '<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />',
  issue_closed: '<circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" />',
  pr_opened: '<circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8.5v10M6 8.5c0 6 4 7 12 7" />',
  pr_closed: '<circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8.5v10M14 14l8 8M22 14l-8 8" />',
  review_requested: '<circle cx="9" cy="8" r="3" /><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5" /><path d="M17 6h5M19.5 3.5v5" />',
  commit: '<circle cx="12" cy="12" r="3" /><path d="M3 12h6M15 12h6" />',
  contributor: '<circle cx="12" cy="9" r="3.5" /><path d="M5 19c.8-3.6 3.4-6 7-6s6.2 2.4 7 6" />',
  validation: '<path d="M5 12l4 4 10-10" />',
  pulse: '<path d="M3 12h4l3-7 4 14 3-7h4" />',
  generic: '<circle cx="12" cy="12" r="6" />'
};

function eventIconMarkup(type) {
  const path = EVENT_ICON_PATHS[type] || EVENT_ICON_PATHS.generic;
  return `<span class="event-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${path}</svg></span>`;
}

function feedMarkup(items, { compact = false } = {}) {
  return items
    .map((item) => {
      const type = htmlEscape(item.type || 'generic');
      const timeLabel = compact ? (formatRelativeTime(item.time) || formatTime(item.time)) : formatTime(item.time);
      if (compact) {
        return `<li data-event-type="${type}"><span class="feed-dot" aria-hidden="true"></span><span class="feed-text">${htmlEscape(item.message)}</span><span class="feed-sep" aria-hidden="true">·</span><time>${htmlEscape(timeLabel)}</time></li>`;
      }
      return `<li data-event-type="${type}">${eventIconMarkup(item.type || 'generic')}<span class="feed-text">${htmlEscape(item.message)}</span><time>${htmlEscape(timeLabel)}</time></li>`;
    })
    .join('');
}

function renderFeed() {
  if (elements.liveFeed) {
    elements.liveFeed.innerHTML = state.feed.length
      ? feedMarkup(state.feed.slice(0, VISIBLE_FEED_ITEMS), { compact: true })
      : '<li class="empty-activity"><span class="feed-text">等待新的协作动态…</span></li>';
  }

  if (elements.activityList) {
    elements.activityList.classList.toggle('is-empty', !state.feed.length);
    elements.activityList.innerHTML = state.feed.length
      ? feedMarkup(state.feed, { compact: false })
      : '<li class="empty-activity"><span>暂无活动记录</span></li>';
  }

  if (elements.activityCount) {
    elements.activityCount.textContent = state.feed.length
      ? `已记录 ${state.feed.length} 条课堂活动`
      : '等待活动记录';
  }
}

function addFeed(message, time = new Date().toISOString(), type = 'generic') {
  state.feed.unshift({ message, time, type });
  state.feed = state.feed.slice(0, MAX_FEED_ITEMS);
  renderFeed();
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return Number(value).toLocaleString('zh-CN');
}

function formatCount(value, truncated = false) {
  const formatted = formatNumber(value);
  return truncated && formatted !== '--' ? `${formatted}+` : formatted;
}

function setConnection(status, text) {
  if (!elements.connectionDot || !elements.connectionText) return;

  elements.connectionDot.classList.remove('online', 'offline');
  if (status) elements.connectionDot.classList.add(status);
  elements.connectionText.textContent = text;
}

function updateGithubSync(github) {
  state.githubHtmlUrl = safeHttpUrl(github?.htmlUrl || '') || '';
  state.githubDefaultBranch = String(github?.defaultBranch || 'main').trim() || 'main';
  state.stargazerSet = new Set(
    (Array.isArray(github?.stargazers) ? github.stargazers : [])
      .map((login) => String(login || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const isSynced = Boolean(github?.ok);

  if (elements.starCount) {
    elements.starCount.textContent = isSynced ? formatNumber(github.stars) : '--';
  }

  if (elements.openTopRepo && state.githubHtmlUrl) {
    elements.openTopRepo.href = state.githubHtmlUrl;
  }

  if (elements.starBadgeLink && state.githubHtmlUrl) {
    elements.starBadgeLink.href = state.githubHtmlUrl;
  }

  if (elements.refreshWall) {
    elements.refreshWall.hidden = !canManualRefresh();
  }
}

function githubProfileUrl(github) {
  return `https://github.com/${encodeURIComponent(github || '')}`;
}

function safeHttpUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function safeHttpsUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function optimizeAvatarUrl(rawUrl, size = 112) {
  const safe = safeHttpsUrl(rawUrl);
  if (!safe) return '';
  try {
    const parsed = new URL(safe);
    if (parsed.hostname === 'avatars.githubusercontent.com') {
      parsed.searchParams.set('s', String(size));
      parsed.searchParams.sort();
      return parsed.href;
    }
    if (parsed.hostname === 'github.com' && parsed.pathname.endsWith('.png')) {
      parsed.searchParams.set('size', String(size));
      return parsed.href;
    }
  } catch {
    return safe;
  }
  return safe;
}

function avatarForProfile(profile) {
  const explicitAvatar = String(profile.avatar || '').trim();
  if (AVATARS.includes(explicitAvatar)) return explicitAvatar;
  const avatarUrl = optimizeAvatarUrl(explicitAvatar, 112);
  if (avatarUrl) return avatarUrl;

  const handle = String(profile.github || '').trim();
  if (/^[A-Za-z0-9-]+$/.test(handle)) {
    return `https://github.com/${encodeURIComponent(handle)}.png?size=112`;
  }

  return AVATARS[0];
}

function starPatternSvg(patternId) {
  switch (patternId) {
    case 'constellation':
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.72">
            <path d="M22 52 L74 32 L128 66 L192 28 L256 54 L298 22" stroke-dasharray="3 4" />
            <path d="M74 32 L106 116 L180 132 L256 54" opacity="0.55" />
            <path d="M192 28 L224 114 L290 144" stroke-dasharray="2 4" opacity="0.5" />
            <path d="M28 158 L106 116 L154 188" opacity="0.45" />
          </g>
          <g fill="currentColor">
            <circle cx="22" cy="52" r="2.2" />
            <circle cx="74" cy="32" r="2.8" />
            <circle cx="128" cy="66" r="2" />
            <circle cx="192" cy="28" r="3" />
            <circle cx="256" cy="54" r="2.4" />
            <circle cx="298" cy="22" r="1.8" />
            <circle cx="106" cy="116" r="2.3" />
            <circle cx="180" cy="132" r="2" />
            <circle cx="224" cy="114" r="2.5" />
            <circle cx="290" cy="144" r="1.8" />
            <circle cx="28" cy="158" r="2" />
            <circle cx="154" cy="188" r="2.2" />
          </g>
        </svg>`;
    case 'sunburst':
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g stroke="currentColor" stroke-width="0.9" opacity="0.65">
            <line x1="278" y1="26" x2="112" y2="-10" />
            <line x1="278" y1="26" x2="78" y2="24" />
            <line x1="278" y1="26" x2="72" y2="74" />
            <line x1="278" y1="26" x2="104" y2="128" />
            <line x1="278" y1="26" x2="152" y2="178" />
            <line x1="278" y1="26" x2="210" y2="212" />
            <line x1="278" y1="26" x2="274" y2="220" />
            <line x1="278" y1="26" x2="332" y2="180" />
            <circle cx="278" cy="26" r="46" fill="none" stroke-dasharray="3 5" opacity="0.5" />
            <circle cx="278" cy="26" r="88" fill="none" stroke-dasharray="2 6" opacity="0.35" />
          </g>
        </svg>`;
    case 'botanical':
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" opacity="0.72">
            <path d="M-4 14 C36 28 64 56 84 102" />
            <path d="M18 24 C42 12 64 16 74 34 C54 44 32 42 18 24Z" />
            <path d="M40 46 C68 38 92 48 96 68 C74 74 52 66 40 46Z" />
            <path d="M36 52 C14 58 2 76 6 94 C26 92 40 76 36 52Z" />
            <path d="M62 76 C44 92 42 114 54 128 C72 116 76 96 62 76Z" />
            <path d="M324 212 C282 196 254 168 238 124" />
            <path d="M294 196 C272 204 252 196 246 178 C268 172 286 178 294 196Z" />
            <path d="M268 168 C242 174 222 162 220 144 C242 140 262 150 268 168Z" />
          </g>
        </svg>`;
    case 'nebula-rings':
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" opacity="0.62">
            <ellipse cx="164" cy="112" rx="142" ry="52" transform="rotate(-14 164 112)" stroke-width="0.9" stroke-dasharray="5 5" />
            <ellipse cx="164" cy="112" rx="108" ry="36" transform="rotate(-14 164 112)" stroke-width="0.85" />
            <ellipse cx="164" cy="112" rx="158" ry="66" transform="rotate(11 164 112)" stroke-width="0.7" stroke-dasharray="2 6" />
          </g>
          <g fill="currentColor" opacity="0.75">
            <circle cx="52" cy="82" r="2.4" />
            <circle cx="276" cy="138" r="2.2" />
            <circle cx="222" cy="58" r="1.8" />
          </g>
        </svg>`;
    case 'sacred-geo':
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.46">
            <path d="M0 55 L80 0 L160 55 L240 0 L320 55 M0 110 L80 55 L160 110 L240 55 L320 110 M0 165 L80 110 L160 165 L240 110 L320 165 M0 220 L80 165 L160 220 L240 165 L320 220" />
            <path d="M0 0 L80 55 L160 0 L240 55 L320 0 M0 55 L80 110 L160 55 L240 110 L320 55 M0 110 L80 165 L160 110 L240 165 L320 110 M0 165 L80 220 L160 165 L240 220 L320 165" />
          </g>
          <g fill="currentColor" opacity="0.6">
            <path d="M80 49 L82 53 L86 55 L82 57 L80 61 L78 57 L74 55 L78 53 Z" />
            <path d="M240 49 L242 53 L246 55 L242 57 L240 61 L238 57 L234 55 L238 53 Z" />
            <path d="M160 104 L162 108 L166 110 L162 112 L160 116 L158 112 L154 110 L158 108 Z" />
          </g>
        </svg>`;
    case 'aurora-waves':
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.56">
            <path d="M-10 42 C58 14, 118 76, 196 42 C252 16, 286 48, 330 28" />
            <path d="M-10 74 C66 44, 126 106, 206 72 C262 46, 294 78, 330 58" opacity="0.82" />
            <path d="M-10 108 C72 78, 134 140, 214 106 C270 80, 298 112, 330 92" opacity="0.62" />
            <path d="M-10 144 C78 114, 142 174, 222 140 C276 116, 304 146, 330 128" opacity="0.44" />
          </g>
        </svg>`;
    case 'compass-rose':
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.64">
            <circle cx="272" cy="172" r="56" />
            <circle cx="272" cy="172" r="44" stroke-dasharray="3 4" />
            <circle cx="272" cy="172" r="14" />
            <path d="M272 104 L278 166 L340 172 L278 178 L272 240 L266 178 L204 172 L266 166 Z" />
            <path d="M234 134 L272 172 L310 210 M310 134 L272 172 L234 210" opacity="0.55" />
          </g>
        </svg>`;
    case 'prism-facets':
    default:
      return `
        <svg class="star-pattern-svg" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="0.85" opacity="0.52">
            <polygon points="18,16 112,4 74,78" />
            <polygon points="112,4 214,32 144,94 74,78" />
            <polygon points="214,32 310,14 276,104 144,94" />
            <polygon points="74,78 144,94 98,176 14,142" />
            <polygon points="144,94 276,104 236,196 98,176" />
            <polygon points="276,104 324,186 236,196" />
          </g>
        </svg>`;
  }
}

function starBadgeSvg(badgeId, uid) {
  const g1 = `sb1-${uid}`;
  const g2 = `sb2-${uid}`;
  switch (badgeId) {
    case 'crystal-star':
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#c4f5ff" />
              <stop offset="48%" stop-color="#d8b4fe" />
              <stop offset="100%" stop-color="#fbcfe8" />
            </linearGradient>
            <linearGradient id="${g2}" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98" />
              <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.72" />
            </linearGradient>
          </defs>
          <path d="M22 3 L27.2 14.5 L39.8 16.1 L30.4 24.8 L32.8 37.4 L22 31.2 L11.2 37.4 L13.6 24.8 L4.2 16.1 L16.8 14.5 Z" fill="url(#${g1})" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" />
          <path d="M22 3 L22 22 L39.8 16.1 Z M22 22 L11.2 37.4 L13.6 24.8 Z" fill="url(#${g2})" opacity="0.75" />
          <path d="M22 11.5 L24 18 L30.5 19 L25.4 23 L26.7 29.5 L22 26.2 L17.3 29.5 L18.6 23 L13.5 19 L20 18 Z" fill="#ffffff" opacity="0.68" />
        </svg>`;
    case 'wax-seal':
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <radialGradient id="${g1}" cx="36%" cy="32%" r="68%">
              <stop offset="0%" stop-color="#e35d47" />
              <stop offset="60%" stop-color="#a12628" />
              <stop offset="100%" stop-color="#691518" />
            </radialGradient>
            <linearGradient id="${g2}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="100%" stop-color="#d9961f" />
            </linearGradient>
          </defs>
          <path d="M22 3.5 C27 3.1 30.6 5.4 34.4 8.2 C38.2 11.4 40.6 15.8 40 21.8 C39.6 27.4 38 32.8 33.4 36.2 C29 39.4 24.8 40.8 19.6 40 C14 39.2 8 36.8 5.6 31 C3.2 25.4 4 18 7 12.2 C10 6.6 16.2 4 22 3.5 Z" fill="url(#${g1})" stroke="#4c1012" stroke-width="1.2" />
          <circle cx="22" cy="22" r="13.5" fill="none" stroke="url(#${g2})" stroke-width="1.5" opacity="0.92" />
          <path d="M22 12.2 L24.8 18.2 L31.2 19 L26.4 23.4 L27.6 29.8 L22 26.6 L16.4 29.8 L17.6 23.4 L12.8 19 L19.2 18.2 Z" fill="url(#${g2})" />
        </svg>`;
    case 'shooting-star':
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="52%" stop-color="#5eead4" />
              <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="${g2}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="58%" stop-color="#fef08a" />
              <stop offset="100%" stop-color="#34d399" />
            </linearGradient>
          </defs>
          <path d="M41 4 C31 9 23 15 14 24" stroke="url(#${g1})" stroke-width="5" stroke-linecap="round" fill="none" />
          <path d="M39 11 C31 15 25 20 19 27" stroke="url(#${g1})" stroke-width="2.4" stroke-linecap="round" fill="none" opacity="0.86" />
          <path d="M16.5 14.5 L19.6 22 L27.5 23 L21.5 28.4 L23 36.4 L16.5 32.2 L10 36.4 L11.5 28.4 L5.5 23 L13.4 22 Z" fill="url(#${g2})" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
        </svg>`;
    case 'crescent-crest':
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef9c3" />
              <stop offset="52%" stop-color="#f5c451" />
              <stop offset="100%" stop-color="#b7791f" />
            </linearGradient>
          </defs>
          <circle cx="22" cy="22" r="17.5" fill="rgba(18, 25, 50, 0.90)" stroke="url(#${g1})" stroke-width="1.8" />
          <path d="M24.4 10.8 A11.2 11.2 0 1 0 31.4 29.6 A8.6 8.6 0 1 1 24.4 10.8 Z" fill="url(#${g1})" />
          <path d="M29 13 L30.4 17 L34.4 18 L30.9 20 L30.8 23.8 L28 21 L24.4 21.8 L26.2 18.4 L24.6 15 L28.2 16.2 Z" fill="#fef9c3" />
        </svg>`;
    case 'ribbon-medal':
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef0b8" />
              <stop offset="52%" stop-color="#d48c3e" />
              <stop offset="100%" stop-color="#8c4a18" />
            </linearGradient>
            <linearGradient id="${g2}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#c95f36" />
              <stop offset="100%" stop-color="#7c2e16" />
            </linearGradient>
          </defs>
          <path d="M14 26 L11 41 L17.6 37 L21.2 41.2 L22 28 Z" fill="url(#${g2})" />
          <path d="M30 26 L33 41 L26.4 37 L22.8 41.2 L22 28 Z" fill="url(#${g2})" />
          <circle cx="22" cy="18" r="13.6" fill="url(#${g1})" stroke="#fff8e3" stroke-width="1.4" />
          <circle cx="22" cy="18" r="10.4" fill="none" stroke="#fff4d6" stroke-width="1" stroke-dasharray="2 2" />
          <path d="M22 10.2 L24.2 15.2 L29.6 15.8 L25.6 19.6 L26.7 25 L22 22.2 L17.3 25 L18.4 19.6 L14.4 15.8 L19.8 15.2 Z" fill="#fffaf0" />
        </svg>`;
    case 'enamel-charm':
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffe4e6" />
              <stop offset="52%" stop-color="#f472b6" />
              <stop offset="100%" stop-color="#be185d" />
            </linearGradient>
            <linearGradient id="${g2}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef3c7" />
              <stop offset="100%" stop-color="#c48a37" />
            </linearGradient>
          </defs>
          <circle cx="22" cy="6.6" r="3.6" fill="none" stroke="url(#${g2})" stroke-width="2.2" />
          <path d="M22 10 L26.4 19 L36.4 20.4 L29 27.4 L30.8 37.2 L22 32.6 L13.2 37.2 L15 27.4 L7.6 20.4 L17.6 19 Z" fill="url(#${g1})" stroke="url(#${g2})" stroke-width="2.2" stroke-linejoin="round" />
          <path d="M18 21.2 Q22 18.2 26.8 20.6" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.88" />
        </svg>`;
    case 'prism-diamond':
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="50%" stop-color="#c084fc" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
          </defs>
          <path d="M22 2.5 L26.2 17.8 L41.5 22 L26.2 26.2 L22 41.5 L17.8 26.2 L2.5 22 L17.8 17.8 Z" fill="url(#${g1})" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round" />
          <path d="M22 10.5 L29.5 22 L22 33.5 L14.5 22 Z" fill="#ffffff" opacity="0.62" />
          <circle cx="22" cy="22" r="3.2" fill="#ffffff" />
        </svg>`;
    case 'laurel-star':
    default:
      return `
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="55%" stop-color="#d4a342" />
              <stop offset="100%" stop-color="#8b651f" />
            </linearGradient>
          </defs>
          <circle cx="22" cy="22" r="17.5" fill="rgba(34, 54, 42, 0.92)" stroke="url(#${g1})" stroke-width="1.7" />
          <path d="M14.2 31 C9.2 27 8.8 19.2 13 13.4 M29.8 31 C34.8 27 35.2 19.2 31 13.4" fill="none" stroke="url(#${g1})" stroke-width="2" stroke-linecap="round" />
          <path d="M22 12 L24.5 17.8 L30.8 18.6 L26 22.8 L27.4 29 L22 25.8 L16.6 29 L18 22.8 L13.2 18.6 L19.5 17.8 Z" fill="url(#${g1})" />
        </svg>`;
  }
}

function cheersMarkup(profile) {
  const cheers = Array.isArray(profile.cheers) ? profile.cheers : [];
  const triggerKey = String(profile.file || profile.github || profile.name || '').trim();

  if (!cheers.length) {
    return `
      <div class="cheers-block is-empty" aria-label="同学寄语">
        <span class="cheers-empty-line">寄语 0 · 合并 PR 后等同学来留言</span>
      </div>
    `;
  }

  const ordered = cheers.slice().reverse();
  const latest = ordered[0];
  const triggerAttr = triggerKey ? ` data-cheers-trigger="${htmlEscape(triggerKey)}"` : '';
  const viewAllBtn = triggerKey
    ? `<button type="button" class="cheers-view-all"${triggerAttr} aria-label="查看 ${htmlEscape(profile.name || profile.github)} 的全部 ${ordered.length} 条寄语">全部 ›</button>`
    : '';

  return `
    <div class="cheers-block" aria-label="同学寄语">
      <div class="cheers-inline-row">
        <span class="cheers-inline-text" title="@${htmlEscape(latest.from)}: ${htmlEscape(latest.message)}">
          <strong class="cheers-count-tag">寄语 ${ordered.length}</strong>
          <span class="cheers-sep" aria-hidden="true">·</span>
          <span class="cheer-from">@${htmlEscape(latest.from)}:</span>
          <span class="cheer-message">${htmlEscape(latest.message)}</span>
        </span>
        ${viewAllBtn}
      </div>
    </div>
  `;
}

function cardMarkup(profile) {
  const name = htmlEscape(profile.name || 'Anonymous');
  const githubRaw = String(profile.github || 'unknown');
  const github = htmlEscape(githubRaw);
  const motto = htmlEscape(profile.motto || '今天完成我的第一个开源 PR');
  const city = htmlEscape(profile.city || '教室');
  const avatar = htmlEscape(avatarForProfile(profile));
  const cheerCount = Array.isArray(profile.cheers) ? profile.cheers.length : 0;
  const recipe = recipeForProfile(profile);
  const score = getProfileScore(profile);
  const isStarred = Boolean(recipe);

  const classes = ['profile-card'];
  if (cheerCount > 0) classes.push('has-cheers');
  if (isStarred) {
    classes.push('is-starred');
    classes.push(`star-tone-${recipe.theme.tone}`);
    classes.push(`star-vfx-tier-${recipe.vfxTier}`);
  }
  if (score.isTop5) classes.push('is-top5-card');

  const sheenDelay = isStarred ? ((recipe.sparkSeed * 7.2) / 100).toFixed(2) : '0';
  const vfxId = isStarred && recipe.vfx ? recipe.vfx.id : 'none';
  const starDataAttrs = isStarred
    ? ` data-star-theme="${recipe.theme.id}" data-star-vfx="${vfxId}" data-star-vfx-tier="${recipe.vfxTier}" data-star-spectrum="${recipe.spectrum.id}" data-star-pattern="${recipe.pattern.id}" data-star-badge="${recipe.badge.id}" style="--star-hue-shift:${recipe.hueShift}deg;--sheen-delay:-${sheenDelay}s"`
    : '';

  const breakdownText = formatScoreBreakdownText(score);
  const nextHint = !score.starred
    ? '点亮仓库 Star 即可解锁典藏闪卡皮肤'
    : (score.nextTierPoints
      ? `再得 ${Math.max(1, score.nextTierPoints - score.points)} 分解锁${score.nextTierPoints === 3 ? '一阶破框特效' : (score.nextTierPoints === 6 ? '二阶觉醒特效' : '十点顶格邻格交互特效')}`
      : '已达成最高十点顶格传说 · 邻格联动');

  let scoreMetaHtml = '';
  if (!score.starred) {
    scoreMetaHtml = `<span class="meta-dot" aria-hidden="true">·</span><span class="meta-score is-unstarred" title="${htmlEscape(nextHint)}">点star开放积分系统</span>`;
  } else {
    const scoreClasses = ['meta-score', `is-tier-${score.vfxTier}`];
    if (score.isTop5) scoreClasses.push('is-top5');
    const stageText = score.tierShort || '0阶';
    const scoreText = score.isTop5
      ? `TOP ${score.rank} ${score.points}分 · ${stageText}`
      : `${score.points}分 · ${stageText}`;
    const scoreTitle = `${score.points} 分（${score.tierLabel}）｜${breakdownText}｜${nextHint}`;
    scoreMetaHtml = `<span class="meta-dot" aria-hidden="true">·</span><span class="${scoreClasses.join(' ')}" title="${htmlEscape(scoreTitle)}">${htmlEscape(scoreText)}</span>`;
  }

  const tierSquares = isStarred
    ? `<span class="tier-squares" aria-hidden="true" title="${htmlEscape(score.tierLabel)}">${Array.from({ length: 3 }, (_, idx) => `<i class="${idx < score.vfxTier ? 'is-on' : ''}"></i>`).join('')}</span>`
    : '';

  const emblemTitle = isStarred
    ? `${score.points}分 · ${score.tierLabel} #${recipe.serial}｜${breakdownText}｜${nextHint}`
    : '';

  const starLayers = isStarred
    ? `
      <div class="card-surface" aria-hidden="true">
        <div class="star-pattern-layer">${starPatternSvg(recipe.pattern.id)}</div>
        <div class="star-foil-layer"></div>
      </div>
      <button type="button" class="star-emblem-btn" data-star-recipe="${htmlEscape(recipe.summary)}" data-star-serial="${htmlEscape(recipe.serial)}" data-star-owner="${github}" data-star-points="${score.points}" data-star-tier="${recipe.vfxTier}" data-star-tier-label="${htmlEscape(score.tierLabel)}" data-star-breakdown="${htmlEscape(breakdownText)}" data-star-next="${htmlEscape(nextHint)}" title="${htmlEscape(emblemTitle)}" aria-label="${name} 的星标卡：${score.points} 分（${htmlEscape(score.tierLabel)}）">
        ${starBadgeSvg(recipe.badge.id, recipe.uid)}
      </button>
    `
    : '';

  const key = profileKey(profile);
  const freshTag = getProfileFreshnessTag(profile);
  const freshLabel = freshTag ? freshTag.replace(/^✨\s*/, '') : '';
  if (freshLabel) classes.push('is-fresh-arrival');
  const freshPillHtml = freshLabel
    ? `<span class="fresh-pill" title="最新上墙 / 最新动态，稍后自动淡出">${htmlEscape(freshLabel)}</span>`
    : '';

  return `
    <article class="${classes.join(' ')}" data-profile-key="${htmlEscape(key)}"${starDataAttrs}>
      ${starLayers}
      ${freshPillHtml}
      <header class="profile-top">
        <img class="avatar-image" src="${avatar}" alt="${name} 的头像" width="38" height="38" loading="lazy" decoding="async" data-fallback-src="${AVATAR_WARNING_FALLBACK}" />
        <div class="identity">
          <h3>${name}</h3>
        </div>
      </header>
      <p class="motto" title="${motto}">${motto}</p>
      <div class="identity-meta">
        <div class="identity-meta-text">
          <a class="handle" href="${githubProfileUrl(profile.github || '')}" target="_blank" rel="noreferrer">@${github}</a>
          <span class="meta-dot" aria-hidden="true">·</span>
          <span class="meta-city">${city}</span>
          ${scoreMetaHtml}
        </div>
        ${tierSquares}
      </div>
      ${cheersMarkup(profile)}
    </article>
  `;
}

function updateStats(payload) {
  const contributors = payload.contributors || [];
  const github = payload.github || {};
  const contributorCount = contributors.length;

  const cheersTotal = typeof payload.cheersTotal === 'number'
    ? payload.cheersTotal
    : contributors.reduce((sum, person) => sum + (Array.isArray(person.cheers) ? person.cheers.length : 0), 0);

  if (elements.statCount) elements.statCount.textContent = contributorCount;
  const countNote = cheersTotal > 0
    ? `累计 ${cheersTotal} 条寄语`
    : (github.ok ? '已上墙贡献者' : '本地 profile');
  if (elements.statCountNote) elements.statCountNote.textContent = countNote;
  if (elements.statCardCount) elements.statCardCount.title = countNote;
  if (elements.statValidation) elements.statValidation.textContent = payload.ok ? '100%' : '待修复';
  if (elements.statStacks) elements.statStacks.textContent = '实时同步';
  if (elements.statPulse) {
    const latestIso = github.latestCommitAt || github.pushedAt || payload.generatedAt;
    elements.statPulse.textContent = formatRelativeTime(latestIso) || formatTime(latestIso);
    if (elements.statCardPulse) elements.statCardPulse.title = `最后同步：${formatTime(latestIso)}`;
  }

  if (elements.statIssues) {
    const total = Number(github.issuesTotal ?? 0);
    elements.statIssues.textContent = github.configured ? formatCount(total, github.issuesTotalTruncated) : '--';
  }
  const issuesNote = !github.configured
    ? '连接 GitHub 后可见'
    : (Number(github.issuesTotal ?? 0) > 0
      ? `${Number(github.openIssuesTotal ?? 0)} open · ${Math.max(0, Number(github.issuesTotal ?? 0) - Number(github.openIssuesTotal ?? 0))} closed`
      : '等待第一个 Issue');
  if (elements.statIssuesNote) elements.statIssuesNote.textContent = issuesNote;
  if (elements.statCardIssues) elements.statCardIssues.title = issuesNote;

  if (elements.statReview) {
    const awaiting = Number(github.awaitingReviewTotal ?? 0);
    elements.statReview.textContent = github.configured ? formatNumber(awaiting) : '--';
  }
  let reviewNote = '连接 GitHub 后可见';
  if (github.configured) {
    const open = Number(github.pullRequestsTotal ?? 0);
    const awaiting = Number(github.awaitingReviewTotal ?? 0);
    if (awaiting > 0) {
      reviewNote = `共 ${formatCount(open, github.pullRequestsTotalTruncated)} 个 open PR`;
    } else if (open > 0) {
      reviewNote = `${formatCount(open, github.pullRequestsTotalTruncated)} 个 open PR`;
    } else {
      reviewNote = '暂无待审 PR';
    }
  }
  if (elements.statReviewNote) elements.statReviewNote.textContent = reviewNote;
  if (elements.statCardReview) elements.statCardReview.title = reviewNote;
}

function updateValidation(payload) {
  const box = elements.validationBox;
  if (!box) return;

  box.classList.toggle('success', Boolean(payload.ok));
  box.classList.toggle('error', !payload.ok);

  if (payload.ok) {
    box.innerHTML = `
      <strong>校验通过。</strong>
      <p>${htmlEscape(payload.message || '所有贡献者文件格式正确。')}</p>
    `;
    box.classList.remove('show');
    return;
  }

  const errors = payload.errors || [];
  box.innerHTML = `
    <strong>校验失败。</strong>
    <p>修复下列问题后，页面会自动恢复到最新数据。</p>
    <ul>${errors.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul>
  `;
  box.classList.add('show');
}

function profileKey(profile) {
  return String(profile?.github || profile?.file || profile?.name || '')
    .trim()
    .replace(/\.json$/i, '')
    .toLowerCase();
}

function latestCheerTsMs(profile) {
  const cheers = Array.isArray(profile?.cheers) ? profile.cheers : [];
  let maxMs = 0;
  for (const cheer of cheers) {
    const ms = Date.parse(cheer?.ts || '') || 0;
    if (ms > maxMs) maxMs = ms;
  }
  return maxMs;
}

function scheduleFreshnessCleanup() {
  if (state.freshnessCleanupTimer) {
    window.clearTimeout(state.freshnessCleanupTimer);
    state.freshnessCleanupTimer = null;
  }
  const now = Date.now();
  let earliestExpiry = Infinity;
  for (const [key, entry] of state.freshnessByHandle.entries()) {
    const remaining = SESSION_FRESH_TTL_MS - (now - entry.markedAt);
    if (remaining <= 0) {
      state.freshnessByHandle.delete(key);
    } else if (remaining < earliestExpiry) {
      earliestExpiry = remaining;
    }
  }
  if (Number.isFinite(earliestExpiry)) {
    state.freshnessCleanupTimer = window.setTimeout(() => {
      state.freshnessCleanupTimer = null;
      scheduleFreshnessCleanup();
      renderWall();
    }, Math.min(earliestExpiry + 200, SESSION_FRESH_TTL_MS + 500));
  }
}

function markProfileFresh(key, tag = '✨ 刚上墙', eventTs = Date.now()) {
  const normalized = String(key || '').trim().replace(/\.json$/i, '').toLowerCase();
  if (!normalized) return;
  const now = Date.now();
  state.freshnessByHandle.set(normalized, {
    ts: Math.max(now, Number(eventTs) || now),
    markedAt: now,
    tag
  });
  scheduleFreshnessCleanup();
}

function getProfileFreshnessTag(profile) {
  const key = profileKey(profile);
  const now = Date.now();
  if (key && state.freshnessByHandle.has(key)) {
    const entry = state.freshnessByHandle.get(key);
    if (now - entry.markedAt < SESSION_FRESH_TTL_MS) {
      return entry.tag;
    }
    state.freshnessByHandle.delete(key);
  }
  const joinedMs = Date.parse(profile?.joinedAt || '') || 0;
  if (joinedMs > 0 && now - joinedMs >= 0 && now - joinedMs < FRESH_WINDOW_MS) {
    return '✨ 刚上墙';
  }
  const cheerMs = latestCheerTsMs(profile);
  if (cheerMs > 0 && now - cheerMs >= 0 && now - cheerMs < FRESH_WINDOW_MS) {
    return '✨ 刚收寄语';
  }
  return '';
}

function profileActivityTimestamp(profile) {
  const key = profileKey(profile);
  const freshEntry = key ? state.freshnessByHandle.get(key) : null;
  const freshTs = freshEntry ? freshEntry.ts : 0;
  const joinedMs = Date.parse(profile?.joinedAt || '') || 0;
  const cheerMs = latestCheerTsMs(profile);
  return Math.max(freshTs, joinedMs, cheerMs);
}

function compareByRecentContribution(a, b) {
  const aPulse = profileActivityTimestamp(a);
  const bPulse = profileActivityTimestamp(b);
  if (aPulse !== bPulse) return bPulse - aPulse;

  const aKey = String(a.github || '').trim().toLowerCase();
  const bKey = String(b.github || '').trim().toLowerCase();
  const aRank = state.commitRankByAuthor.has(aKey) ? state.commitRankByAuthor.get(aKey) : Number.MAX_SAFE_INTEGER;
  const bRank = state.commitRankByAuthor.has(bKey) ? state.commitRankByAuthor.get(bKey) : Number.MAX_SAFE_INTEGER;
  if (aRank !== bRank) return aRank - bRank;

  return String(a.github || a.name).localeCompare(String(b.github || b.name));
}

function sortContributors(contributors) {
  return contributors.slice().sort(compareByRecentContribution);
}

function syncHonorRibbonActive(activeKey = '') {
  if (!elements.honorRibbonList) return;
  const target = String(activeKey || '').trim().toLowerCase();
  elements.honorRibbonList.querySelectorAll('.honor-pill').forEach((btn) => {
    btn.classList.toggle('is-spotlight-active', Boolean(target) && btn.dataset.honorTarget === target);
  });
}

function renderHonorRibbon() {
  if (!elements.honorRibbon || !elements.honorRibbonList) return;

  const top5 = state.wallContributors
    .map((profile) => ({ profile, score: getProfileScore(profile), key: profileKey(profile) }))
    .filter(({ score, key }) => Boolean(key && score && score.isTop5))
    .sort((a, b) => (a.score.rank || 99) - (b.score.rank || 99))
    .slice(0, 5);

  if (!top5.length) {
    elements.honorRibbon.hidden = true;
    elements.honorRibbonList.innerHTML = '';
    return;
  }

  elements.honorRibbon.hidden = false;
  elements.honorRibbonList.style.setProperty('--honor-count', String(top5.length));
  elements.honorRibbonList.innerHTML = top5.map(({ profile, score, key }) => {
    const rank = score.rank || 1;
    const rankNum = String(rank).padStart(2, '0');
    const handle = htmlEscape(profile.github || profile.name || key);
    const avatar = htmlEscape(avatarForProfile(profile));
    const breakdown = formatScoreBreakdownText(score);
    const title = `#${rank} @${profile.github || profile.name} · ${score.points}分（${score.tierLabel}）｜${breakdown}｜点击定位并释放破框大招`;
    const crownSvg = rank === 1
      ? '<svg class="honor-pill-crown" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.2 12.2h11.6L14.5 5 11 7.6 8 3.2 5 7.6 1.5 5Z" /></svg>'
      : '';
    const ctaText = rank === 1 ? '放招 ↗' : '↗';
    return `
      <button
        type="button"
        class="honor-pill is-rank-${rank}${score.vfxTier >= 3 ? ' is-tier-3' : ''}"
        data-honor-target="${htmlEscape(key)}"
        title="${htmlEscape(title)}"
      >
        <span class="honor-pill-top">
          <span class="honor-pill-rank">${rankNum}</span>
          ${crownSvg}
          <img class="honor-pill-avatar" src="${avatar}" alt="" width="24" height="24" loading="lazy" decoding="async" data-fallback-src="${AVATAR_WARNING_FALLBACK}" />
          <span class="honor-pill-handle">@${handle}</span>
        </span>
        <span class="honor-pill-bottom">
          <span class="honor-pill-pts">${score.points}分 · ${htmlEscape(score.tierShort || '0阶')}</span>
          <span class="honor-pill-cta" aria-hidden="true">${ctaText}</span>
        </span>
      </button>
    `;
  }).join('');

  if (elements.honorRibbonHint) {
    const isSpotlight = state.wallFilter === 'leaderboard';
    elements.honorRibbonHint.classList.toggle('is-spotlight-mode', isSpotlight);
    if (elements.honorRibbonHintText) {
      elements.honorRibbonHintText.textContent = isSpotlight ? '聚光灯点名中' : '≥5分 · 点选直达';
    }
  }
}

function setWallFilter(filterName) {
  const nextFilter = filterName || 'all';
  state.wallFilter = nextFilter;
  $$('.wall-filter-pill').forEach((item) => {
    const active = (item.dataset.wallFilter || 'all') === nextFilter;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  state.vfxEngine?.setDirectorMode(nextFilter === 'leaderboard' ? 'spotlight' : 'ambient');
  renderWall();
}

function focusHonorTarget(targetKey) {
  const key = String(targetKey || '').trim().toLowerCase();
  if (!key || !elements.wall) return;

  const findCard = () => Array.from(elements.wall.querySelectorAll('.profile-card')).find(
    (el) => el.dataset.profileKey === key
  );

  let card = findCard();
  if (!card) {
    if (elements.wallSearch && elements.wallSearch.value) {
      elements.wallSearch.value = '';
    }
    if (state.wallFilter !== 'all' && state.wallFilter !== 'leaderboard') {
      setWallFilter('all');
    } else {
      renderWall();
    }
    card = findCard();
  }
  if (!card) return;

  const vpRect = elements.wallViewport ? elements.wallViewport.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
  const cardRect = card.getBoundingClientRect();
  const alreadyVisible = cardRect.top >= vpRect.top + 16 && cardRect.bottom <= vpRect.bottom - 16;

  card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

  elements.wall.querySelectorAll('.profile-card.is-honor-spotlight').forEach((el) => el.classList.remove('is-honor-spotlight'));
  card.classList.add('is-honor-spotlight');
  window.clearTimeout(state.honorSpotlightTimer);
  state.honorSpotlightTimer = window.setTimeout(() => {
    card.classList.remove('is-honor-spotlight');
  }, 1900);

  const fireBurst = () => {
    if (!document.body.contains(card)) return;
    const tier = Number(card.dataset.starVfxTier || 0);
    if (tier > 0) {
      state.vfxEngine?.focusTriggerCard(card, { intensity: 1.28 });
    }
  };

  if (alreadyVisible) {
    fireBurst();
  } else {
    window.setTimeout(fireBurst, 300);
  }

  const profile = state.wallContributors.find((p) => profileKey(p) === key);
  if (profile) {
    const score = getProfileScore(profile);
    const recipe = recipeForProfile(profile);
    const lineageText = recipe?.vfx ? ` · ${recipe.vfx.lineage}「${recipe.vfx.label}」` : '';
    toast(`🏆 #${score.rank || 1} @${profile.github || profile.name}（${score.points}分${lineageText}）`, 3200);
  }
}

function wallSearchText(profile) {
  const cheers = Array.isArray(profile.cheers) ? profile.cheers : [];
  const cheerTexts = cheers.flatMap((cheer) => [cheer.from, cheer.message]);
  const recipe = recipeForProfile(profile);
  return [
    profile.name,
    profile.github,
    profile.motto,
    profile.city,
    profile.file,
    recipe ? recipe.summary : '',
    ...cheerTexts
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
}

function currentWallQuery() {
  return String(elements.wallSearch?.value || '').trim().toLowerCase();
}

function filteredWallContributors() {
  const query = currentWallQuery();
  const filter = state.wallFilter;

  const list = state.wallContributors.filter((profile) => {
    if (filter === 'starred' && !recipeForProfile(profile)) return false;
    if (filter === 'cheers' && !(Array.isArray(profile.cheers) && profile.cheers.length > 0)) return false;
    if (query && !wallSearchText(profile).includes(query)) return false;
    return true;
  });

  if (filter === 'leaderboard') {
    return list.slice().sort((a, b) => {
      const sa = getProfileScore(a);
      const sb = getProfileScore(b);
      if (sb.points !== sa.points) return sb.points - sa.points;
      if (Number(sb.starred) !== Number(sa.starred)) return Number(sb.starred) - Number(sa.starred);
      return (sa.rank || 999) - (sb.rank || 999);
    });
  }

  return list;
}

function updateWallMeta({ total, filtered, starredCount, query }) {
  if (elements.wallSummary) {
    if (!total) {
      elements.wallSummary.textContent = '· 等待同学提交 profile';
    } else if (query || state.wallFilter !== 'all') {
      elements.wallSummary.textContent = `· 显示 ${filtered} / ${total} 位贡献者`;
    } else if (starredCount > 0) {
      elements.wallSummary.textContent = `· 共 ${total} 位贡献者 · ${starredCount} 位解锁星标特效`;
    } else {
      elements.wallSummary.textContent = `· 共 ${total} 位贡献者`;
    }
  }

  if (elements.clearWallSearch) {
    elements.clearWallSearch.hidden = !query;
  }

  if (elements.toggleWallMotion) {
    elements.toggleWallMotion.hidden = starredCount === 0;
  }
}

function renderWall() {
  if (!elements.wall) return;

  const total = state.wallContributors.length;
  const query = currentWallQuery();
  const filtered = filteredWallContributors();
  const starredCount = state.starRecipes.size;

  updateWallMeta({
    total,
    filtered: filtered.length,
    starredCount,
    query
  });
  renderHonorRibbon();

  if (!total) {
    elements.wall.innerHTML = '<div class="empty-wall">还没有贡献者。复制模板，创建你的 profile 文件，然后运行 npm run validate。</div>';
    return;
  }

  if (!filtered.length) {
    const emptyHint = state.wallFilter === 'starred'
      ? '还没有同学解锁星标限定特效，点亮右上角 Star 成为第一位吧！'
      : (state.wallFilter === 'cheers'
        ? '暂时还没有收到寄语的卡片。'
        : '没有匹配的贡献者，换一个关键词试试。');
    elements.wall.innerHTML = `<div class="empty-wall">${htmlEscape(emptyHint)}</div>`;
    return;
  }

  elements.wall.innerHTML = filtered.map(cardMarkup).join('');
  state.vfxEngine?.notifyWallRendered();
}

function detectTierEvolutions(payload) {
  const current = new Map();
  for (const profile of payload.contributors || []) {
    const key = profileKey(profile);
    if (!key) continue;
    const score = getProfileScore(profile);
    current.set(key, {
      tier: score.vfxTier || 0,
      points: score.points || 0,
      display: profile.github || profile.name || key,
      tierLabel: score.tierLabel
    });
  }

  if (!state.bootstrappedTiers) {
    state.knownTiersByHandle = current;
    state.bootstrappedTiers = true;
    return false;
  }

  let evolved = false;
  for (const [key, info] of current.entries()) {
    const prev = state.knownTiersByHandle.get(key);
    if (prev && (info.tier > prev.tier || info.points > prev.points)) {
      markProfileFresh(key, info.tier > prev.tier ? '✨ 刚进化' : '✨ 刚加分');
      if (info.tier > prev.tier) {
        addFeed(`@${info.display} 升阶至「${info.tierLabel}」`, payload.generatedAt, 'star');
      }
      evolved = true;
    }
  }
  state.knownTiersByHandle = current;
  return evolved;
}

function updateWall(payload) {
  if (!elements.wall) return;

  const rankMap = new Map();
  const commits = Array.isArray(payload.github?.commits) ? payload.github.commits : [];
  commits.forEach((commit, idx) => {
    const key = String(commit.author || '').trim().toLowerCase();
    if (key && !rankMap.has(key)) {
      rankMap.set(key, idx);
    }
  });
  state.commitRankByAuthor = rankMap;

  const rawContributors = payload.contributors || [];
  assignStarRecipes(rawContributors);
  detectNewStars(payload);
  detectTierEvolutions(payload);

  state.wallContributors = sortContributors(rawContributors);

  // In demo-tiers preview mode, showcase the transient '✨ 刚上墙' badge on the newest Row-1 arrival once
  if (demoTiersEnabled() && !state.demoFreshSeeded && state.wallContributors.length) {
    state.demoFreshSeeded = true;
    markProfileFresh(profileKey(state.wallContributors[0]), '✨ 刚上墙');
  }

  renderWall();
}

function detectNewContributors(payload) {
  const incoming = new Set((payload.contributors || []).map((person) => profileKey(person)).filter(Boolean));
  const newHandles = [];

  for (const handle of incoming) {
    if (handle && !state.knownHandles.has(handle)) {
      newHandles.push(handle);
      if (state.lastOk !== null) {
        markProfileFresh(handle, '✨ 刚上墙');
      }
    }
  }

  state.knownHandles = incoming;

  if (newHandles.length && state.lastOk !== null) {
    addFeed(`新增 ${newHandles.length} 位贡献者: ${newHandles.join(', ')}`, payload.generatedAt, 'contributor');
  }
}

function detectNewCheers(payload) {
  const allCheers = [];
  (payload.contributors || []).forEach((profile) => {
    const owner = profileKey(profile);
    (profile.cheers || []).forEach((cheer) => {
      const key = `${owner}|${String(cheer.from || '').toLowerCase()}|${String(cheer.message || '').trim()}`;
      allCheers.push({ key, owner, profile, cheer });
    });
  });

  if (!state.bootstrappedCheers) {
    state.knownCheerKeys = new Set(allCheers.map((item) => item.key));
    state.bootstrappedCheers = true;
    return;
  }

  const fresh = allCheers.filter((item) => !state.knownCheerKeys.has(item.key));
  fresh.forEach((item) => state.knownCheerKeys.add(item.key));

  if (!fresh.length) return;

  fresh.forEach(({ owner, profile, cheer }) => {
    markProfileFresh(owner, '✨ 刚收寄语', Date.parse(cheer.ts || '') || Date.now());
    const to = profile.github || profile.name || 'unknown';
    addFeed(`@${cheer.from} → @${to}: ${cheer.message}`, cheer.ts || payload.generatedAt, 'cheer');
  });
}

function detectNewStars(payload) {
  const starredNow = new Map();
  (payload.contributors || []).forEach((profile) => {
    const key = profileKey(profile);
    if (key && state.starRecipes.has(key)) {
      starredNow.set(key, profile.github || profile.name || key);
    }
  });

  if (!state.bootstrappedStars) {
    state.knownStarredHandles = new Set(starredNow.keys());
    state.bootstrappedStars = true;
    return;
  }

  for (const [key, display] of starredNow.entries()) {
    if (!state.knownStarredHandles.has(key)) {
      state.knownStarredHandles.add(key);
      markProfileFresh(key, '✨ 刚进化');
      addFeed(`@${display} 解锁了星标限定特效`, payload.generatedAt, 'star');
    }
  }
}

function syncGithubEvents(payload) {
  const events = payload.github?.events || [];
  events.slice().reverse().forEach((event) => {
    const key = event.key || `${event.type}:${event.time}:${event.message}`;
    if (state.knownGithubEvents.has(key)) return;
    state.knownGithubEvents.add(key);
    addFeed(event.message, event.time || payload.generatedAt, event.type || 'generic');
  });
}

function setRefreshButtonState(label, disabled, { busy = false } = {}) {
  if (elements.refreshWall) {
    elements.refreshWall.disabled = disabled;
    elements.refreshWall.classList.toggle('is-busy', Boolean(busy));
  }
  if (elements.refreshWallLabel) {
    elements.refreshWallLabel.textContent = label;
  }
}

function formatCooldownDuration(seconds) {
  const total = Math.max(1, Math.ceil(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) return `${secs}s`;
  return secs > 0 ? `${mins}分${String(secs).padStart(2, '0')}秒` : `${mins}分钟`;
}

function savePersonalRefreshCooldown(seconds) {
  try {
    const until = Date.now() + Math.max(1, Math.floor(seconds)) * 1000;
    window.localStorage.setItem(REFRESH_COOLDOWN_STORAGE_KEY, String(until));
  } catch {
    // Ignore storage quota / privacy mode errors.
  }
}

function clearPersonalRefreshCooldown() {
  try {
    window.localStorage.removeItem(REFRESH_COOLDOWN_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

function readPersonalRefreshCooldownRemaining() {
  try {
    const raw = window.localStorage.getItem(REFRESH_COOLDOWN_STORAGE_KEY);
    const until = Number(raw || 0);
    if (!Number.isFinite(until) || until <= Date.now()) {
      return 0;
    }
    return Math.ceil((until - Date.now()) / 1000);
  } catch {
    return 0;
  }
}

function startRefreshCooldown(seconds, { persist = true } = {}) {
  if (state.refreshCooldownTimer) {
    window.clearInterval(state.refreshCooldownTimer);
    state.refreshCooldownTimer = null;
  }

  let remaining = Math.max(1, Math.floor(seconds));
  if (persist) {
    savePersonalRefreshCooldown(remaining);
  }
  setRefreshButtonState(`${formatCooldownDuration(remaining)}后可刷新`, true, { busy: false });
  state.refreshCooldownTimer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      window.clearInterval(state.refreshCooldownTimer);
      state.refreshCooldownTimer = null;
      clearPersonalRefreshCooldown();
      setRefreshButtonState(REFRESH_LABEL_DEFAULT, false);
      return;
    }
    setRefreshButtonState(`${formatCooldownDuration(remaining)}后可刷新`, true, { busy: false });
  }, 1000);
}

function buildRefreshToastMessage(data) {
  const git = data?.git || {};
  const github = data?.github || {};
  const parts = [];

  if (git.ok && !git.skipped) {
    parts.push(git.pulled > 0
      ? `贡献者：已同步 ${git.pulled} 个新提交`
      : '贡献者：已是最新');
  } else if (git.skipped) {
    parts.push(`贡献者未同步（${git.reason || '已跳过'}）`);
  } else if (git.reason) {
    parts.push(`贡献者同步失败：${git.reason}`);
  }

  if (github.ok) {
    parts.push('已刷新星标与动态');
  } else if (github.configured === false) {
    parts.push('未连接 GitHub');
  } else if (github.message) {
    parts.push(`刷新失败 - ${github.message}`);
  }

  return parts.length ? parts.join(' · ') : '已尝试刷新';
}

async function manuallyRefreshWall() {
  if (state.refreshing || !canManualRefresh()) return;

  const endpoint = state.dataMode === 'api'
    ? 'api/refresh'
    : `${refreshApiBase()}/api/refresh`;

  state.refreshing = true;
  setRefreshButtonState('正在刷新…', true, { busy: true });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });

    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      if (data?.state) {
        applyState(data.state);
      }
      const retrySeconds = Math.max(1, Math.ceil((data.retryInMs || 180000) / 1000));
      startRefreshCooldown(retrySeconds);
      toast(data.message || `刷新冷却中：${formatCooldownDuration(retrySeconds)}后可再刷新`);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data?.state) {
      applyState(data.state);
    }
    toast(data.message || buildRefreshToastMessage(data));

    const cooldownMs = Number(data.cooldownMs || data.retryInMs || 0);
    if (cooldownMs > 0) {
      startRefreshCooldown(Math.ceil(cooldownMs / 1000));
    } else {
      setRefreshButtonState(REFRESH_LABEL_DEFAULT, false);
    }
  } catch (error) {
    toast(`刷新失败: ${error.message || '未知错误'}`);
    setRefreshButtonState(REFRESH_LABEL_DEFAULT, false);
  } finally {
    state.refreshing = false;
  }
}

function bindRefreshControls() {
  if (elements.refreshWall) {
    elements.refreshWall.addEventListener('click', manuallyRefreshWall);
    const savedRemaining = readPersonalRefreshCooldownRemaining();
    if (savedRemaining > 0) {
      startRefreshCooldown(savedRemaining, { persist: false });
    }
  }
}

function payloadTimestamp(payload) {
  if (!payload) return 0;
  return Number(payload.refreshedAt || 0) || Date.parse(payload.generatedAt || '') || 0;
}

function readCachedState() {
  try {
    const raw = window.sessionStorage?.getItem(STATE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.payload && Array.isArray(parsed.payload.contributors)) {
      return parsed;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

function writeCachedState(payload) {
  if (!payload || !payload.ok || !Array.isArray(payload.contributors)) return;
  try {
    window.sessionStorage?.setItem(
      STATE_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        mode: state.dataMode || '',
        payload
      })
    );
  } catch {
    // Ignore storage quota or private mode errors
  }
}

function applyState(payload) {
  updateGithubSync(payload.github);
  updateStats(payload);
  updateValidation(payload);
  detectNewContributors(payload);
  detectNewCheers(payload);
  updateWall(payload);
  syncGithubEvents(payload);

  const fp = String(payload.fingerprint || '');
  if (state.lastOk !== payload.ok) {
    addFeed(payload.ok ? '数据恢复正常，贡献者墙已刷新' : '数据校验失败，等待修复', payload.generatedAt, 'validation');
  } else if (!fp || fp !== state.lastFingerprint) {
    addFeed(payload.message || '收到一次数据刷新', payload.generatedAt, 'pulse');
  }

  state.lastOk = payload.ok;
  if (fp) state.lastFingerprint = fp;
  state.lastPayloadTime = Math.max(state.lastPayloadTime, payloadTimestamp(payload));
  writeCachedState(payload);
}

function dataSourceMode() {
  return document.querySelector('meta[name="app-data-source"]')?.getAttribute('content') || 'auto';
}

function refreshApiBase() {
  return String(document.querySelector('meta[name="app-refresh-api"]')?.getAttribute('content') || '')
    .trim()
    .replace(/\/+$/, '');
}

function canManualRefresh() {
  return state.dataMode === 'api' || Boolean(refreshApiBase());
}

async function fetchState() {
  const workerBase = refreshApiBase();
  const workerEndpoint = workerBase ? [{ url: `${workerBase}/api/state`, mode: 'worker' }] : [];
  const endpoints = dataSourceMode() === 'static' ? [
    ...workerEndpoint,
    { url: 'contributors.json', mode: 'static' }
  ] : [
    { url: 'api/contributors', mode: 'api' },
    ...workerEndpoint,
    { url: 'contributors.json', mode: 'static' }
  ];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${endpoint.url} HTTP ${response.status}`);
      state.dataMode = endpoint.mode;
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No contributor data source is available');
}

function startFallbackPolling() {
  if (state.dataMode === 'static' || state.dataMode === 'worker') return;
  if (state.fallbackTimer) return;
  state.fallbackTimer = window.setInterval(async () => {
    try {
      const payload = await fetchState();
      applyState(payload);
    } catch {
      setConnection('offline', '实时通道断开');
    }
  }, 3000);
}

function connectEvents() {
  if (state.dataMode === 'worker') {
    setConnection('online', '实时更新中');
    addFeed('已加载云端聚合快照，点击「立即刷新」可按需同步', new Date().toISOString(), 'pulse');
    return;
  }

  if (state.dataMode === 'static') {
    setConnection('online', '静态构建');
    addFeed('静态页面已加载，合并 main 后自动发布', new Date().toISOString(), 'pulse');
    return;
  }

  if (!('EventSource' in window)) {
    setConnection('offline', '轮询模式');
    startFallbackPolling();
    return;
  }

  const source = new EventSource('events');

  source.addEventListener('open', () => {
    setConnection('online', '实时更新中');
    addFeed('SSE 实时通道已连接', new Date().toISOString(), 'pulse');
  });

  source.addEventListener('state', (event) => {
    const payload = JSON.parse(event.data);
    setConnection(payload.ok ? 'online' : 'offline', payload.ok ? '实时更新中' : '等待校验修复');
    applyState(payload);
  });

  source.addEventListener('pulse', (event) => {
    const payload = JSON.parse(event.data);
    toast(payload.message || '收到新的课堂反馈');
  });

  source.addEventListener('heartbeat', (event) => {
    const payload = JSON.parse(event.data);
    if (elements.statPulse) {
      elements.statPulse.textContent = formatRelativeTime(payload.at) || formatTime(payload.at);
    }
  });

  source.addEventListener('error', () => {
    setConnection('offline', '连接重试中');
    startFallbackPolling();
  });
}

function openActivityPanel() {
  if (!elements.activityOverlay || !elements.activityPanel) return;

  state.activityReturnFocus = document.activeElement;
  renderFeed();
  elements.activityOverlay.hidden = false;
  if (elements.viewAllFeed) elements.viewAllFeed.setAttribute('aria-expanded', 'true');
  document.body.classList.add('activity-open');
  elements.activityPanel.focus();
}

function closeActivityPanel() {
  if (!elements.activityOverlay) return;

  elements.activityOverlay.hidden = true;
  if (elements.viewAllFeed) elements.viewAllFeed.setAttribute('aria-expanded', 'false');
  if (!elements.cheersOverlay || elements.cheersOverlay.hidden) {
    document.body.classList.remove('activity-open');
  }

  if (state.activityReturnFocus && typeof state.activityReturnFocus.focus === 'function') {
    state.activityReturnFocus.focus();
  }
}

function bindActivityPanel() {
  if (elements.viewAllFeed) {
    elements.viewAllFeed.addEventListener('click', openActivityPanel);
  }

  if (elements.closeActivity) {
    elements.closeActivity.addEventListener('click', closeActivityPanel);
  }

  if (elements.activityOverlay) {
    elements.activityOverlay.addEventListener('click', (event) => {
      if (event.target === elements.activityOverlay) closeActivityPanel();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (elements.cheersOverlay && !elements.cheersOverlay.hidden) {
      closeCheersOverlay();
      return;
    }
    if (elements.activityOverlay && !elements.activityOverlay.hidden) {
      closeActivityPanel();
    }
  });
}

function findContributorByHandle(handle) {
  if (!handle) return null;
  const target = String(handle).toLowerCase();
  return state.wallContributors.find((profile) =>
    String(profile.file || '').toLowerCase() === target ||
    String(profile.github || profile.name || '').toLowerCase() === target
  ) || null;
}

function openCheersTitleText(profile) {
  const display = profile.name || profile.github || 'unknown';
  return profile.github ? `${display} (@${profile.github}) 收到的寄语` : `${display} 收到的寄语`;
}

function cheersFullMarkup(cheers) {
  if (!cheers.length) {
    return '<li class="empty-activity"><span>暂无寄语</span></li>';
  }

  return cheers
    .slice()
    .reverse()
    .map((cheer) => {
      const from = htmlEscape(cheer.from || 'unknown');
      const message = htmlEscape(cheer.message || '');
      const relative = cheer.ts ? formatRelativeTime(cheer.ts) : '';
      const time = relative ? `<time>${htmlEscape(relative)}</time>` : '<time>—</time>';
      return `
        <li>
          ${time}
          <div class="cheer-line">
            <span class="cheer-from">@${from}</span>
            <span class="cheer-message">${message}</span>
          </div>
        </li>
      `;
    })
    .join('');
}

function openCheersOverlay(profile) {
  if (!profile || !elements.cheersOverlay || !elements.cheersPanel) return;

  state.cheersReturnFocus = document.activeElement;
  const cheers = Array.isArray(profile.cheers) ? profile.cheers : [];

  if (elements.cheersTitle) {
    elements.cheersTitle.textContent = openCheersTitleText(profile);
  }
  if (elements.cheersSubtitle) {
    elements.cheersSubtitle.textContent = cheers.length
      ? `共 ${cheers.length} 条寄语，按时间倒序`
      : '还没有寄语';
  }
  if (elements.cheersFullList) {
    elements.cheersFullList.classList.toggle('is-empty', !cheers.length);
    elements.cheersFullList.innerHTML = cheersFullMarkup(cheers);
    elements.cheersFullList.scrollTop = 0;
  }

  elements.cheersOverlay.hidden = false;
  document.body.classList.add('activity-open');
  elements.cheersPanel.focus();
}

function closeCheersOverlay() {
  if (!elements.cheersOverlay) return;

  elements.cheersOverlay.hidden = true;
  if (!elements.activityOverlay || elements.activityOverlay.hidden) {
    document.body.classList.remove('activity-open');
  }

  if (state.cheersReturnFocus && typeof state.cheersReturnFocus.focus === 'function') {
    state.cheersReturnFocus.focus();
  }
  state.cheersReturnFocus = null;
}

function bindCheersOverlay() {
  if (elements.closeCheers) {
    elements.closeCheers.addEventListener('click', closeCheersOverlay);
  }

  if (elements.cheersOverlay) {
    elements.cheersOverlay.addEventListener('click', (event) => {
      if (event.target === elements.cheersOverlay) closeCheersOverlay();
    });
  }

  if (elements.wall) {
    elements.wall.addEventListener('click', (event) => {
      const starBtn = event.target.closest('.star-emblem-btn');
      if (starBtn && elements.wall.contains(starBtn)) {
        event.preventDefault();
        const card = starBtn.closest('.profile-card.is-starred');
        const owner = starBtn.getAttribute('data-star-owner') || '';
        const points = Number(starBtn.getAttribute('data-star-points') || 0);
        const tier = Number(starBtn.getAttribute('data-star-tier') || 0);
        const tierLabel = starBtn.getAttribute('data-star-tier-label') || '星标闪卡';
        const breakdown = starBtn.getAttribute('data-star-breakdown') || '';
        const nextHint = starBtn.getAttribute('data-star-next') || '';
        const recipe = starBtn.getAttribute('data-star-recipe') || '';
        if (card && tier > 0) state.vfxEngine?.triggerSurge(card);
        const icon = tier >= 3 ? '👑' : (tier === 2 ? '⚡' : (tier === 1 ? '✦' : '★'));
        toast(`${icon} @${owner} · ${points}分（${tierLabel}）｜${breakdown}｜${nextHint}｜${recipe}`, 5200);
        return;
      }

      const trigger = event.target.closest('[data-cheers-trigger]');
      if (trigger && elements.wall.contains(trigger)) {
        event.preventDefault();
        const profile = findContributorByHandle(trigger.getAttribute('data-cheers-trigger'));
        if (profile) openCheersOverlay(profile);
        return;
      }

      if (event.target.closest('a, button')) return;
      const vfxCard = event.target.closest('.profile-card.is-starred');
      if (vfxCard && elements.wall.contains(vfxCard) && Number(vfxCard.dataset.starVfxTier || 0) > 0) {
        state.vfxEngine?.triggerSurge(vfxCard);
      }
    });
  }
}

function setMotionPaused(paused, { persist = true } = {}) {
  state.motionPaused = Boolean(paused);
  if (elements.wall) {
    elements.wall.classList.toggle('is-motion-paused', state.motionPaused);
  }
  state.vfxEngine?.setPaused(state.motionPaused);
  if (elements.toggleWallMotion) {
    elements.toggleWallMotion.textContent = state.motionPaused ? '开启动效' : '暂停动效';
    elements.toggleWallMotion.classList.toggle('is-paused', state.motionPaused);
  }
  if (persist) {
    try {
      window.localStorage.setItem(MOTION_PREF_STORAGE_KEY, state.motionPaused ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  }
}

function bindStarCardTilt() {
  if (!elements.wall) return;
  const finePointerQuery = window.matchMedia?.('(hover: hover) and (pointer: fine)');
  const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let activeCard = null;
  let rafId = 0;
  let pendingX = 0.5;
  let pendingY = 0.5;

  function clearTilt(card) {
    if (!card) return;
    card.classList.remove('is-tilting');
    card.style.removeProperty('--pointer-x');
    card.style.removeProperty('--pointer-y');
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    card.style.removeProperty('--foil-angle');
  }

  function flushTilt() {
    rafId = 0;
    if (!activeCard) return;
    const dx = pendingX - 0.5;
    const dy = pendingY - 0.5;
    const tiltX = (-dy * 7.5).toFixed(2);
    const tiltY = (dx * 8.5).toFixed(2);
    const angle = (115 + dx * 48 - dy * 30).toFixed(1);
    activeCard.style.setProperty('--pointer-x', `${(pendingX * 100).toFixed(1)}%`);
    activeCard.style.setProperty('--pointer-y', `${(pendingY * 100).toFixed(1)}%`);
    activeCard.style.setProperty('--tilt-x', `${tiltX}deg`);
    activeCard.style.setProperty('--tilt-y', `${tiltY}deg`);
    activeCard.style.setProperty('--foil-angle', `${angle}deg`);
  }

  elements.wall.addEventListener('pointermove', (event) => {
    if (state.motionPaused || reducedMotionQuery?.matches || !finePointerQuery?.matches) {
      if (activeCard) {
        clearTilt(activeCard);
        activeCard = null;
      }
      return;
    }

    const card = event.target.closest('.profile-card.is-starred');
    if (card !== activeCard) {
      clearTilt(activeCard);
      activeCard = card;
      if (activeCard) activeCard.classList.add('is-tilting');
      state.vfxEngine?.setHoveredCard(activeCard);
    }
    if (!activeCard) return;

    const rect = activeCard.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pendingX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    pendingY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    if (!rafId) {
      rafId = window.requestAnimationFrame(flushTilt);
    }
  });

  elements.wall.addEventListener('pointerleave', () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    clearTilt(activeCard);
    activeCard = null;
    state.vfxEngine?.setHoveredCard(null);
  });
}

function bindWallControls() {
  if (elements.wallSearch) {
    elements.wallSearch.addEventListener('input', () => {
      renderWall();
    });
  }

  if (elements.clearWallSearch) {
    elements.clearWallSearch.addEventListener('click', () => {
      if (elements.wallSearch) {
        elements.wallSearch.value = '';
        elements.wallSearch.focus();
      }
      renderWall();
    });
  }

  $$('.wall-filter-pill').forEach((button) => {
    button.addEventListener('click', () => {
      setWallFilter(button.dataset.wallFilter || 'all');
    });
  });

  if (elements.honorRibbonList) {
    elements.honorRibbonList.addEventListener('click', (event) => {
      const pill = event.target.closest('[data-honor-target]');
      if (!pill || !elements.honorRibbonList.contains(pill)) return;
      focusHonorTarget(pill.getAttribute('data-honor-target'));
    });
  }

  if (elements.toggleWallMotion) {
    try {
      const saved = window.localStorage.getItem(MOTION_PREF_STORAGE_KEY);
      if (saved === '1') setMotionPaused(true, { persist: false });
    } catch {
      // Ignore storage errors
    }

    elements.toggleWallMotion.addEventListener('click', () => {
      setMotionPaused(!state.motionPaused);
    });
  }

  bindStarCardTilt();
}

function bindAvatarFallback() {
  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (!image.dataset.fallbackSrc) return;
    if (image.dataset.fallbackApplied === 'true') return;

    image.dataset.fallbackApplied = 'true';
    image.src = image.dataset.fallbackSrc || AVATAR_WARNING_FALLBACK;
    image.alt = '头像图片不可用';
  }, true);
}

async function revalidateStaticAndWorkerInBackground({ checkStatic = false } = {}) {
  if (checkStatic) {
    try {
      const staticResp = await fetch('contributors.json', { priority: 'low' });
      if (staticResp.ok) {
        const staticPayload = await staticResp.json();
        if (payloadTimestamp(staticPayload) > state.lastPayloadTime) {
          applyState(staticPayload);
        }
      }
    } catch {
      // Ignore background static check errors
    }
  }

  const workerBase = refreshApiBase();
  if (!workerBase) return;

  try {
    const response = await fetch(`${workerBase}/api/state`, {
      cache: 'no-store',
      priority: 'low'
    });
    if (!response.ok) return;
    const workerPayload = await response.json();
    const incomingTime = payloadTimestamp(workerPayload);
    if (incomingTime >= state.lastPayloadTime || workerPayload.fingerprint !== state.lastFingerprint) {
      state.dataMode = 'worker';
      applyState(workerPayload);
    }
  } catch {
    // Keep already-rendered snapshot silently
  }
}

async function bootstrapState() {
  if (dataSourceMode() === 'static') {
    const cached = readCachedState();
    if (cached) {
      state.dataMode = refreshApiBase() ? 'worker' : (cached.mode || 'static');
      applyState(cached.payload);
      connectEvents();
      revalidateStaticAndWorkerInBackground({ checkStatic: true });
      return;
    }

    try {
      const response = await fetch('contributors.json');
      if (response.ok) {
        const staticPayload = await response.json();
        state.dataMode = refreshApiBase() ? 'worker' : 'static';
        applyState(staticPayload);
        connectEvents();
        revalidateStaticAndWorkerInBackground({ checkStatic: false });
        return;
      }
    } catch {
      // Fall through to fetchState()
    }
  }

  try {
    const payload = await fetchState();
    applyState(payload);
    connectEvents();
  } catch {
    setConnection('offline', '数据加载失败');
  }
}

function initVfxEngine() {
  if (!elements.vfxOverlay || typeof window.PulseWallVfxEngine !== 'function') return;
  state.vfxEngine = new window.PulseWallVfxEngine({
    canvas: elements.vfxOverlay,
    wallEl: elements.wall,
    viewportEl: elements.wallViewport,
    onSpotlightChange: (card) => {
      syncHonorRibbonActive(card?.dataset?.profileKey || '');
    }
  });
  if (state.motionPaused) {
    state.vfxEngine.setPaused(true);
  }
}

initVfxEngine();
bindAvatarFallback();
bindActivityPanel();
bindCheersOverlay();
bindWallControls();
bindRefreshControls();
renderFeed();
bootstrapState();
