/* =========================================================================
 * Open Source Pulse Wall · 开源星系 (3D)
 * The #1 contributor *is* the sun. Everyone else is a planet on inclined,
 * Kepler-paced orbits around it. The whole system rests in the palm of a
 * colossal arm reaching out of total darkness, beneath one eldritch eye.
 * Rendered with Three.js (vendored in /vendor/three) + bloom.
 * ========================================================================= */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildAbyss } from './abyss.js';

const MAX_FEED_ITEMS = 30;
const VISIBLE_FEED_ITEMS = 3;
const REFRESH_LABEL_DEFAULT = '立即刷新';
const STATE_CACHE_KEY = 'pulse-wall:state:v6';
const REFRESH_COOLDOWN_STORAGE_KEY = 'pulse-wall:refresh-cooldown-until';
const MOTION_PREF_STORAGE_KEY = 'pulse-wall:orbit-paused';
const FRESH_WINDOW_MS = 20 * 60 * 1000;
const SESSION_FRESH_TTL_MS = 95 * 1000;
const AVATAR_WARNING_FALLBACK = 'avatars/avatar-warning.svg';
const TAU = Math.PI * 2;

// Dimension 1: planet palette (gas bands + atmosphere)
const STAR_THEMES = [
  { id: 'prism', label: '棱镜虹彩', tone: 'light', color: '#7dd3fc', ring: '#c4b5fd' },
  { id: 'goldleaf', label: '鎏金典藏', tone: 'light', color: '#f6d88b', ring: '#fbbf24' },
  { id: 'aurora', label: '翡翠极光', tone: 'dark', color: '#34d399', ring: '#5eead4' },
  { id: 'sakura', label: '落樱玫瑰金', tone: 'light', color: '#fb7185', ring: '#fbcfe8' },
  { id: 'celestial', label: '午夜星穹', tone: 'dark', color: '#818cf8', ring: '#c7d2fe' },
  { id: 'opalescent', label: '月白欧泊', tone: 'light', color: '#a5f3fc', ring: '#e0f2fe' },
  { id: 'amber', label: '琥珀鎏铜', tone: 'light', color: '#fb923c', ring: '#fcd34d' },
  { id: 'obsidian', label: '黑曜紫晶', tone: 'dark', color: '#c084fc', ring: '#f0abfc' }
];

// Dimension 2: astronomically coherent single-plane equatorial ring systems
const STAR_RING_STYLES = [
  { id: 'single', label: '卡西尼典藏环', tilt: 0.34, bands: [[1.38, 2.24]], outer: 2.24, opacity: 0.82, dust: 0 },
  { id: 'double', label: '双带离析环', tilt: -0.30, bands: [[1.34, 1.66], [1.88, 2.28]], outer: 2.28, opacity: 0.78, dust: 0 },
  { id: 'gossamer', label: '薄纱冰晶环', tilt: 0.24, bands: [[1.42, 1.96]], outer: 1.96, opacity: 0.44, dust: 0 },
  { id: 'broad', label: '阔幅冰尘大环', tilt: 0.22, bands: [[1.30, 2.52]], outer: 2.52, opacity: 0.86, dust: 360 },
  { id: 'braided', label: '牧羊共振环', tilt: -0.26, bands: [[1.36, 1.78], [1.90, 2.24]], outer: 2.24, opacity: 0.76, dust: 480 },
  { id: 'subtle', label: '星辉微环', tilt: -0.18, bands: [[1.56, 1.86]], outer: 1.86, opacity: 0.52, dust: 0 },
  { id: 'dusty', label: '炽尘渐变环', tilt: 0.38, bands: [[1.34, 2.34]], outer: 2.34, opacity: 0.72, dust: 420 },
  { id: 'triple', label: '三重谐振光环', tilt: -0.36, bands: [[1.28, 1.50], [1.62, 2.02], [2.16, 2.46]], outer: 2.46, opacity: 0.84, dust: 440 }
];

// Dimension 3: moons
const STAR_MOONS = [
  { id: 'none', label: '孤星守望', count: 0, speed: 1 },
  { id: 'solo', label: '伴星巡游', count: 1, speed: 1 },
  { id: 'binary', label: '双月共舞', count: 2, speed: 0.9 },
  { id: 'trio', label: '三星伴月', count: 3, speed: 0.8 },
  { id: 'fast', label: '疾风卫星', count: 1, speed: 1.9 },
  { id: 'wide', label: '远轨伴星', count: 2, speed: 0.6 },
  { id: 'spark', label: '微尘星群', count: 3, speed: 1.3 },
  { id: 'sentinel', label: '守护双星', count: 2, speed: 1.2 }
];

// Dimension 4: badge on the planet card
const STAR_BADGES = [
  { id: 'crystal-star', label: '水晶棱镜星', icon: '✦' },
  { id: 'wax-seal', label: '复古火漆印', icon: '✪' },
  { id: 'shooting-star', label: '璀璨流星章', icon: '☄' },
  { id: 'crescent-crest', label: '新月星辰章', icon: '☾' },
  { id: 'ribbon-medal', label: '丝带星勋章', icon: '✧' },
  { id: 'enamel-charm', label: '珐琅星挂坠', icon: '★' },
  { id: 'prism-diamond', label: '八芒星菱钻', icon: '❖' },
  { id: 'laurel-star', label: '月桂星冠章', icon: '❂' }
];

// Dimension 2: 16 Distinct Mythic, Elemental & Easter-Egg Frame-Break Lineages (all Starred users unlock top-tier directly!)
const STAR_VFX = [
  { id: 'dragon-summon', lineage: '炎龙血脉', label: '焚天古龙王' },
  { id: 'hero-slays-dragon', lineage: '勇者屠龙', label: '圣光斩穹 · 屠龙史诗' },
  { id: 'seraph-descent', lineage: '炽天使降临', label: '六翼炽天使 · 圣光天穹' },
  { id: 'abyss-demon', lineage: '深渊魔王', label: '深渊魔君 · 炎狱锁链' },
  { id: 'thunder-zeus', lineage: '雷神裁决', label: '万雷天罚 · 雷神战锤' },
  { id: 'paladin-cavalry', lineage: '圣殿骑士团', label: '圣殿骑兵总攻' },
  { id: 'sword-immortal', lineage: '青莲剑仙', label: '万剑归宗' },
  { id: 'vermilion-phoenix', lineage: '朱雀涅槃', label: '九霄朱雀 · 涅槃凤舞' },
  { id: 'celestial-butterfly', lineage: '幻光星蝶', label: '织梦星蝶 · 浮光掠影' },
  { id: 'chrono-clockwork', lineage: '永恒时计', label: '苍穹星钟 · 时序逆转' },
  { id: 'arcane-cosmos', lineage: '星界天象', label: '诸神黄昏 · 星界禁咒' },
  { id: 'kunpeng-whale', lineage: '逍遥鲲鹏', label: '化鲲为鹏 · 扶摇九万里' },
  { id: 'raging-tsunami', lineage: '沧海怒涛', label: '怒海狂澜 · 惊涛拍岸' },
  { id: 'meteor-shower', lineage: '星穹陨雨', label: '天穹流星 · 群星坠落' },
  { id: 'glacial-freeze', lineage: '绝对零度', label: '冰封千里 · 永冬凛域' },
  { id: 'shadow-eminence', lineage: '影之实力者', label: '雨夜武心祭 · I AM ATOMIC' }
];

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

const TOTAL_STAR_COMBINATIONS =
  STAR_THEMES.length * STAR_RING_STYLES.length * STAR_MOONS.length * STAR_BADGES.length *
  STAR_VFX.length * STAR_SPECTRA.length * STAR_PATTERNS.length;

const TOP5_LIMIT = 5;
const TOP5_MIN_POINTS = 1;
const TIER_PERCENTILE_CUTOFFS = { tier3: 0.15, tier2: 0.5 };

// The champion sun and its retinue. Each orbit lives in its own inclined plane
// (inclination + ascending node) so the system reads as a true 3D gyroscope.
const SUN_RADIUS = 1700;
const ORBITS = [
  { id: 'top5', r: 6200, incl: 0.12, node: 0.3, style: 0, label: 'TOP 2–5 内环', hint: '恒星近卫', color: '#fbbf24' },
  { id: 'tier3', r: 9400, incl: 0.34, node: 1.5, style: 1, label: '三阶 · 顶格传说', hint: 'TOP 5 后前 15%', color: '#fb7185' },
  { id: 'tier2', r: 13600, incl: -0.24, node: 2.7, style: 2, label: '二阶 · 觉醒进化', hint: '排名 15%–50%', color: '#38bdf8' },
  { id: 'tier1', r: 18800, incl: 0.42, node: 3.9, style: 3, label: '一阶 · 初醒破框', hint: '排名后 50%', color: '#818cf8' },
  { id: 'outer', r: 25600, incl: 0.07, node: 0.9, style: 4, label: '外缘星带', hint: '点 Star 入轨排名', color: '#94a3b8', belt: 2800 }
];
const ORBIT_BY_ID = Object.fromEntries(ORBITS.map((orbit) => [orbit.id, orbit]));
const KEPLER_K = 36000;

const TOP5_PALETTE = {
  1: { name: '恒星王座', halo: '#ffd166' },
  2: { name: '银辉近卫', halo: '#e2e8f0' },
  3: { name: '青铜近卫', halo: '#f0a46b' },
  4: { name: '极光近卫', halo: '#7dd3fc' },
  5: { name: '极光近卫', halo: '#86efac' }
};

const TOP5_SIZE = { 2: 615, 3: 575, 4: 535, 5: 495 };
const PLANET_SIZE_RANGE = { tier3: [285, 355], tier2: [165, 215], tier1: [84, 114], outer: [30, 46] };
const UNSTARRED_COLOR = '#94a3b8';

const CAMERA_PRESETS = {
  awe: { label: '仰望', position: [10200, 7200, 34500], target: [0, 650, 0] },
  overview: { label: '俯瞰', position: [0, 54000, 39500], target: [0, 0, 0] },
  flyby: { label: '掠过星带', position: [-21500, 1400, 19500], target: [0, 1200, 0] },
  gaze: { label: '神明一瞥', position: [50000, 72000, 552000], target: [0, 650, 0] }
};
const PRESET_ORDER = ['awe', 'overview', 'flyby'];

const AVATARS = Array.from({ length: 11 }, (_, index) => `avatars/avatar-${String(index + 1).padStart(2, '0')}.png`);

const $ = (selector) => document.querySelector(selector);

const elements = {
  canvas: $('#galaxyCanvas'),
  labelLayer: $('#labelLayer'),
  webglFallback: $('#webglFallback'),
  connectionDot: $('#connectionDot'),
  connectionText: $('#connectionText'),
  starCount: $('#starCount'),
  starBadgeLink: $('#starBadgeLink'),
  openTopRepo: $('#openTopRepo'),
  openOverview: $('#openOverview'),
  statCount: $('#statCount'),
  statCardCount: $('#statCardCount'),
  statCheers: $('#statCheers'),
  statIssues: $('#statIssues'),
  statCardIssues: $('#statCardIssues'),
  statReview: $('#statReview'),
  statCardReview: $('#statCardReview'),
  statValidation: $('#statValidation'),
  statPulse: $('#statPulse'),
  validationBox: $('#validationBox'),
  liveFeed: $('#liveFeed'),
  viewAllFeed: $('#viewAllFeed'),
  activityPanel: $('#activityPanel'),
  activityList: $('#activityList'),
  activityCount: $('#activityCount'),
  cheersPanel: $('#cheersPanel'),
  cheersTitle: $('#cheersTitle'),
  cheersSubtitle: $('#cheersSubtitle'),
  cheersFullList: $('#cheersFullList'),
  honorRibbon: $('#honorRibbon'),
  honorRibbonList: $('#honorRibbonList'),
  honorRibbonTrack: $('#honorRibbonTrack'),
  podiumViewport: $('#podiumViewport'),
  rankCount: $('#rankCount'),
  vfxOverlay: $('#vfxOverlay'),
  wallSearch: $('#wallSearch'),
  clearWallSearch: $('#clearWallSearch'),
  searchResults: $('#searchResults'),
  btnZoomIn: $('#btnZoomIn'),
  btnZoomOut: $('#btnZoomOut'),
  btnZoomReset: $('#btnZoomReset'),
  btnConstellation: $('#btnConstellation'),
  btnTour: $('#btnTour'),
  toggleWallMotion: $('#toggleWallMotion'),
  planetCardHost: $('#planetCardHost'),
  planetTooltip: $('#planetTooltip'),
  jumpBanner: $('#jumpBanner'),
  refreshWall: $('#refreshWall'),
  refreshWallLabel: $('#refreshWallLabel'),
  toast: $('#toast')
};

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
  freshnessCleanupTimer: null,
  feed: [],
  lastOk: null,
  lastPayload: null,
  lastFingerprint: '',
  lastPayloadTime: 0,
  fallbackTimer: null,
  dataMode: '',
  wallContributors: [],
  starRecipes: new Map(),
  profileScores: new Map(),
  stargazerSet: new Set(),
  githubHtmlUrl: '',
  githubDefaultBranch: 'main',
  refreshing: false,
  refreshCooldownTimer: null,
  motionPaused: false,
  pendingEffects: []
};

const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => Boolean(reducedMotionQuery?.matches);

/* ------------------------------------------------------------------ utils */

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
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
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

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return Number(value).toLocaleString('zh-CN');
}

function formatCount(value, truncated = false) {
  const formatted = formatNumber(value);
  return truncated && formatted !== '--' ? `${formatted}+` : formatted;
}

function toast(message, duration = 2800) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => elements.toast.classList.remove('show'), duration);
}

function showJumpBanner(message, duration = 4200) {
  const banner = elements.jumpBanner;
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
  banner.classList.remove('is-live');
  void banner.offsetWidth;
  banner.classList.add('is-live');
  window.clearTimeout(showJumpBanner.timer);
  showJumpBanner.timer = window.setTimeout(() => {
    banner.classList.remove('is-live');
    banner.hidden = true;
  }, duration);
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

function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
  const num = Number.parseInt(full.slice(0, 6), 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}



function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapPi(angle) {
  let a = (angle + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
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

function optimizeAvatarUrl(rawUrl, size = 128) {
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

function avatarForProfile(profile, size = 128) {
  const explicitAvatar = String(profile?.avatar || '').trim();
  if (AVATARS.includes(explicitAvatar)) return explicitAvatar;
  const avatarUrl = optimizeAvatarUrl(explicitAvatar, size);
  if (avatarUrl) return avatarUrl;
  const handle = String(profile?.github || '').trim();
  if (/^[A-Za-z0-9-]+$/.test(handle)) {
    return `https://github.com/${encodeURIComponent(handle)}.png?size=${size}`;
  }
  return AVATARS[0];
}

function profileKey(profile) {
  return String(profile?.github || profile?.file || profile?.name || '')
    .trim()
    .replace(/\.json$/i, '')
    .toLowerCase();
}

function displayName(profile) {
  return String(profile?.name || profile?.github || '未命名同学');
}

/* -------------------------------------------------------------- scoring */

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

function computeTierCutoffs(poolSize) {
  const M = Math.max(0, Math.floor(Number(poolSize) || 0));
  if (M <= 1) return { tier3End: 0, tier2End: 0 };
  if (M === 2) return { tier3End: 0, tier2End: 1 };
  const tier3End = Math.max(1, Math.ceil(M * TIER_PERCENTILE_CUTOFFS.tier3));
  const tier2End = Math.max(tier3End + 1, Math.ceil(M * TIER_PERCENTILE_CUTOFFS.tier2));
  return { tier3End, tier2End };
}

function resolveRankTier({ starred, rank, starredCount } = {}) {
  const totalStarred = Math.max(0, Math.floor(Number(starredCount) || 0));
  const r = Math.floor(Number(rank) || 0);
  const poolSize = Math.max(0, totalStarred - TOP5_LIMIT);
  const { tier3End, tier2End } = computeTierCutoffs(poolSize);

  if (!starred || r <= 0 || totalStarred <= 0) {
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

  const rankPercentile = Math.round((r / totalStarred) * 1000) / 10;
  if (r === 1) {
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
  if (r <= TOP5_LIMIT) {
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

  const poolRank = r - TOP5_LIMIT;
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

function buildPromotionInfo({ starred, points, rank, orbitId, starredCount, rankedStarred, cutoffs }) {
  if (!starred || rank <= 0 || starredCount <= 0) {
    return {
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
    };
  }

  if (orbitId === 'sun' || rank === 1) {
    const second = rankedStarred[1];
    const leadPoints = second ? Math.max(0, points - second.points) : points;
    return {
      targetOrbitId: null,
      targetLabel: null,
      targetHint: null,
      targetRank: 1,
      ranksNeeded: 0,
      thresholdPoints: points,
      pointsToTie: 0,
      pointsToPass: 0,
      leadPoints,
      progress: 100
    };
  }

  let targetOrbitId = 'sun';
  let targetRank = 1;
  let targetLabel = '#1 恒星王座';
  let targetHint = '榜首';
  const top5Edge = Math.min(TOP5_LIMIT, starredCount);
  let tierTop = 2;
  let tierBottomSlot = top5Edge;
  let tierBottom = top5Edge + 1;

  if (orbitId === 'tier3') {
    targetOrbitId = 'top5';
    targetRank = TOP5_LIMIT;
    targetLabel = 'TOP 2–5 内环';
    targetHint = '恒星近卫';
    tierTop = TOP5_LIMIT + 1;
    tierBottomSlot = TOP5_LIMIT + cutoffs.tier3End;
    tierBottom = TOP5_LIMIT + cutoffs.tier3End + 1;
  } else if (orbitId === 'tier2') {
    if (cutoffs.tier3End > 0) {
      targetOrbitId = 'tier3';
      targetRank = TOP5_LIMIT + cutoffs.tier3End;
      targetLabel = '三阶 · 顶格传说';
      targetHint = '前 15%';
    } else {
      targetOrbitId = 'top5';
      targetRank = top5Edge;
      targetLabel = 'TOP 2–5 内环';
      targetHint = '恒星近卫';
    }
    tierTop = TOP5_LIMIT + cutoffs.tier3End + 1;
    tierBottomSlot = TOP5_LIMIT + cutoffs.tier2End;
    tierBottom = TOP5_LIMIT + cutoffs.tier2End + 1;
  } else if (orbitId === 'tier1') {
    if (cutoffs.tier2End > 0) {
      targetOrbitId = 'tier2';
      targetRank = TOP5_LIMIT + cutoffs.tier2End;
      targetLabel = '二阶 · 觉醒进化';
      targetHint = '前 50%';
    } else {
      targetOrbitId = 'top5';
      targetRank = top5Edge;
      targetLabel = 'TOP 2–5 内环';
      targetHint = '恒星近卫';
    }
    tierTop = TOP5_LIMIT + cutoffs.tier2End + 1;
    tierBottomSlot = starredCount;
    tierBottom = starredCount;
  }

  const gatekeeper = rankedStarred[targetRank - 1];
  const thresholdPoints = gatekeeper ? gatekeeper.points : points;
  const ranksNeeded = Math.max(1, rank - targetRank);
  const pointsToTie = Math.max(0, thresholdPoints - points);
  const pointsToPass = Math.max(1, thresholdPoints - points + 1);
  const singleSlotTier = tierTop >= tierBottomSlot;
  const span = Math.max(1, tierBottom - targetRank);
  const rawPct = ((tierBottom - rank) / span) * 100;
  const progress = singleSlotTier ? 96 : Math.min(96, Math.max(8, Math.round(rawPct)));

  return {
    targetOrbitId,
    targetLabel,
    targetHint,
    targetRank,
    ranksNeeded,
    thresholdPoints,
    pointsToTie,
    pointsToPass,
    leadPoints: 0,
    progress
  };
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

const VALID_STARRED_ORBITS = new Set(['sun', 'top5', 'tier3', 'tier2', 'tier1']);
const VALID_STARRED_TIER_IDS = new Set(['sun', 'top-5', 'tier-3', 'tier-2', 'tier-1']);

function unrankedFallbackTier(starred) {
  if (!starred) return resolveRankTier({ starred: false, rank: 0, starredCount: 0 });
  return {
    vfxTier: 1,
    orbitId: 'tier1',
    tierId: 'tier-1',
    tierLabel: '一阶 · 初醒破框',
    tierShort: '一阶',
    poolRank: null,
    poolSize: 0,
    poolPercentile: null,
    rankPercentile: null
  };
}

function scoreForProfile(profile, fallbackCheersMap = null, demoSlot = -1) {
  const starred = isProfileStarred(profile);
  if (demoTiersEnabled() && starred && demoSlot >= 0) {
    const demoPointsPool = [16, 13, 11, 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 2, 1];
    const pts = demoSlot < demoPointsPool.length ? demoPointsPool[demoSlot] : 1;
    const cheerPts = Math.min(3, Math.max(0, pts - 1));
    const pairPts = Math.floor(Math.max(0, pts - 1 - cheerPts) / 2) * 2;
    const unranked = resolveRankTier({ starred: true, rank: demoSlot + 1, starredCount: Math.max(demoSlot + 1, demoPointsPool.length) });
    return {
      points: pts,
      starred: true,
      ...unranked,
      nextTierPoints: null,
      rank: demoSlot + 1,
      isTop5: demoSlot < TOP5_LIMIT,
      breakdown: { star: 1, cheers: cheerPts, cheerTargets: [], pair: pairPts, pairPartners: [] }
    };
  }

  if (profile?.score && typeof profile.score.points === 'number') {
    const prev = profile.score;
    const prevBreakdown = prev.breakdown || {};
    const starPts = starred ? 1 : 0;
    const cheersPts = Number(prevBreakdown.cheers || 0);
    const pairPts = Number(prevBreakdown.pair || 0);
    const hasSplit = prev.breakdown && (typeof prevBreakdown.cheers === 'number' || typeof prevBreakdown.pair === 'number');
    const points = Boolean(prev.starred) === starred
      ? prev.points
      : (hasSplit ? starPts + cheersPts + pairPts : Math.max(0, prev.points + (starred ? 1 : -1)));
    const fallbackTier = unrankedFallbackTier(starred);
    return {
      ...prev,
      points,
      starred,
      vfxTier: starred ? (prev.vfxTier || fallbackTier.vfxTier) : 0,
      orbitId: starred ? (VALID_STARRED_ORBITS.has(prev.orbitId) ? prev.orbitId : fallbackTier.orbitId) : 'outer',
      tierId: starred ? (VALID_STARRED_TIER_IDS.has(prev.tierId) ? prev.tierId : fallbackTier.tierId) : 'locked',
      tierLabel: starred ? (prev.tierLabel || fallbackTier.tierLabel) : '未点 Star',
      tierShort: starred ? (prev.tierShort || fallbackTier.tierShort) : '',
      nextTierPoints: null,
      breakdown: {
        star: starPts,
        cheers: cheersPts,
        cheerTargets: Array.isArray(prevBreakdown.cheerTargets) ? prevBreakdown.cheerTargets : [],
        pair: pairPts,
        pairPartners: Array.isArray(prevBreakdown.pairPartners) ? prevBreakdown.pairPartners : []
      }
    };
  }

  const key = profileKey(profile);
  const starPts = starred ? 1 : 0;
  const sentTargets = fallbackCheersMap ? Array.from(fallbackCheersMap.get(key) || []) : [];
  const cheerPts = Math.min(3, sentTargets.length);
  const points = starPts + cheerPts;
  const fallbackTier = unrankedFallbackTier(starred);
  return {
    points,
    starred,
    ...fallbackTier,
    nextTierPoints: null,
    rank: 0,
    isTop5: false,
    promotion: buildPromotionInfo({ starred, points, rank: 0, orbitId: fallbackTier.orbitId, starredCount: 0, rankedStarred: [], cutoffs: { tier3End: 0, tier2End: 0 } }),
    breakdown: { star: starPts, cheers: cheerPts, cheerTargets: sentTargets, pair: 0, pairPartners: [] }
  };
}

function applyRankPercentileToProfiles(profiles, scoreMap) {
  const entries = profiles
    .map((profile) => {
      const key = profileKey(profile);
      const s = key ? scoreMap.get(key) : null;
      if (!s) return null;
      return {
        key,
        profile,
        score: s,
        starred: s.starred ? 1 : 0,
        points: Number(s.points || 0),
        cheersSent: Array.isArray(s.breakdown?.cheerTargets) ? s.breakdown.cheerTargets.length : Number(s.breakdown?.cheers || 0),
        cheersReceived: Array.isArray(profile.cheers) ? profile.cheers.length : 0,
        joinedTs: Date.parse(profile.joinedAt || '') || Number.POSITIVE_INFINITY,
        handle: String(profile.github || profile.name || key).toLowerCase()
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.starred !== a.starred) return b.starred - a.starred;
      if (b.points !== a.points) return b.points - a.points;
      if (b.cheersSent !== a.cheersSent) return b.cheersSent - a.cheersSent;
      if (b.cheersReceived !== a.cheersReceived) return b.cheersReceived - a.cheersReceived;
      if (a.joinedTs !== b.joinedTs) return a.joinedTs - b.joinedTs;
      return a.handle.localeCompare(b.handle);
    });

  const rankedStarred = entries.filter((e) => e.starred === 1);
  const starredCount = rankedStarred.length;
  const cutoffs = computeTierCutoffs(Math.max(0, starredCount - TOP5_LIMIT));

  entries.forEach((entry, idx) => {
    const rank = idx + 1;
    const starred = Boolean(entry.starred);
    const tier = resolveRankTier({ starred, rank, starredCount });
    const isTop5 = starred && rank <= TOP5_LIMIT && entry.points >= TOP5_MIN_POINTS;
    const promotion = buildPromotionInfo({
      starred,
      points: entry.points,
      rank,
      orbitId: tier.orbitId,
      starredCount,
      rankedStarred,
      cutoffs
    });
    const updated = {
      ...entry.score,
      ...tier,
      rank,
      isTop5,
      starredTotal: starredCount,
      nextTierPoints: null,
      promotion
    };
    scoreMap.set(entry.key, updated);
    entry.score = updated;
  });
}

function formatScoreBreakdownText(score) {
  const b = score?.breakdown || {};
  const parts = [];
  if (b.star) parts.push(`⭐Star +${b.star}`);
  if (b.cheers) parts.push(`💬寄语 +${b.cheers}`);
  if (b.pair) parts.push(`🤝结对 +${b.pair}`);
  return parts.length ? parts.join(' · ') : '尚未获得积分';
}

function pickLeastUsedIndex(preferred, size, stepSeed, counts) {
  let minCount = Infinity;
  for (let i = 0; i < size; i += 1) minCount = Math.min(minCount, counts[i]);
  if (counts[preferred] === minCount) return preferred;
  const stride = (stepSeed % (size - 1)) + 1;
  for (let probe = 1; probe < size; probe += 1) {
    const candidate = (preferred + probe * stride) % size;
    if (counts[candidate] === minCount) return candidate;
  }
  return preferred;
}

function buildRecipe(seedKey, indices, scoreInfo) {
  const theme = STAR_THEMES[indices[0]];
  const ring = STAR_RING_STYLES[indices[1]];
  const moon = STAR_MOONS[indices[2]];
  const badge = STAR_BADGES[indices[3]];
  const lineageSlot = indices[4] % STAR_VFX.length;
  const spectrum = STAR_SPECTRA[indices[5]];
  const pattern = STAR_PATTERNS[indices[6]];
  const vfxTier = 3;
  const vfx = STAR_VFX[lineageSlot];
  const codeHash = hashString(`${seedKey}:${indices.join('-')}`, 0x811c9dc5);
  const serial = (codeHash & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const skinSummary = `${theme.label} × ${pattern.label} × ${badge.label}`;
  const planetSummary = `${ring.label} × ${moon.label}`;
  return {
    key: indices.join(':'),
    serial,
    uid: `${serial.toLowerCase()}-${indices.join('')}`,
    theme,
    ring,
    moon,
    badge,
    spectrum,
    pattern,
    vfxTier,
    vfx,
    hueShift: ((codeHash >>> 16) % 25) - 12,
    sparkSeed: (codeHash >>> 24) % 100,
    score: scoreInfo,
    skinSummary,
    summary: `${vfx.lineage}·${vfx.label} × ${spectrum.label} × ${skinSummary} × ${planetSummary}`
  };
}

// Balanced, collision-free 7-D recipe assignment so neighbouring planets and cards look distinct.
function assignStarRecipes(contributors) {
  const recipes = new Map();
  const scores = new Map();
  const usedCombos = new Set();
  const fallbackCheersMap = buildFallbackScoresMap(contributors);
  const sizes = [
    STAR_THEMES.length,
    STAR_RING_STYLES.length,
    STAR_MOONS.length,
    STAR_BADGES.length,
    STAR_VFX.length,
    STAR_SPECTRA.length,
    STAR_PATTERNS.length
  ];
  const dimCounts = sizes.map((size) => new Array(size).fill(0));
  const ordered = contributors.slice().sort((a, b) => profileKey(a).localeCompare(profileKey(b)));

  let demoStarSlot = 0;
  for (const profile of ordered) {
    const key = profileKey(profile);
    if (!key) continue;
    const starred = isProfileStarred(profile);
    const scoreInfo = scoreForProfile(profile, fallbackCheersMap, starred ? demoStarSlot++ : -1);
    scores.set(key, scoreInfo);
    if (!starred) continue;

    const h1 = hashString(key, 0x811c9dc5);
    const h2 = hashString(`${key}#pulse-planet`, 0x9e3779b9);
    const h3 = hashString(`wall:${key}:aura`, 0x85ebca6b);
    const preferred = [h1 % sizes[0], (h1 >>> 8) % sizes[1], h2 % sizes[2], (h2 >>> 10) % sizes[3], (h1 >>> 8) % sizes[4], h3 % sizes[5], (h3 >>> 10) % sizes[6]];
    const steps = [h1 >>> 16, h2 >>> 16, h1 >>> 24, h2 >>> 24, h3 >>> 16, h3 >>> 8, h3 >>> 24];
    let indices = preferred.map((pref, dim) => pickLeastUsedIndex(pref, sizes[dim], steps[dim], dimCounts[dim]));
    let attempt = 0;
    while (usedCombos.has(indices.join(':')) && attempt < 256) {
      attempt += 1;
      const dim = attempt % sizes.length;
      indices = indices.slice();
      indices[dim] = (indices[dim] + 1) % sizes[dim];
    }
    usedCombos.add(indices.join(':'));
    indices.forEach((value, dim) => { dimCounts[dim][value] += 1; });
    recipes.set(key, { indices, seedKey: key });
  }

  const hasCompleteBackendScores = !demoTiersEnabled() && !demoStarsEnabled() && ordered.every((profile) => {
    const key = profileKey(profile);
    if (!key) return true;
    const s = profile.score;
    const starred = isProfileStarred(profile);
    return Boolean(
      s &&
      typeof s.points === 'number' &&
      Boolean(s.starred) === starred &&
      typeof s.orbitId === 'string' &&
      (starred ? VALID_STARRED_ORBITS.has(s.orbitId) : s.orbitId === 'outer') &&
      typeof s.starredTotal === 'number' &&
      s.promotion &&
      typeof s.rank === 'number' &&
      s.rank > 0
    );
  });
  if (!hasCompleteBackendScores) {
    applyRankPercentileToProfiles(ordered, scores);
  }

  state.starRecipes = new Map(Array.from(recipes.entries()).map(([key, { indices, seedKey }]) => [key, buildRecipe(seedKey, indices, scores.get(key))]));
  state.profileScores = scores;
}

function getProfileScore(profile) {
  const key = profileKey(profile);
  return (key && state.profileScores.get(key)) || scoreForProfile(profile);
}

function recipeForProfile(profile) {
  const key = profileKey(profile);
  return key ? state.starRecipes.get(key) || null : null;
}

/* ============================================================ scene model */

const scene = {
  planets: [],
  planetByKey: new Map(),
  champion: null,
  links: [],
  linksByKey: new Map(),
  ringPhase: Object.fromEntries(ORBITS.map((orbit, i) => [orbit.id, i * 1.3])),
  ringCounts: Object.fromEntries(ORBITS.map((orbit) => [orbit.id, 0])),
  selectedKey: null,
  lockedKey: null,
  lockedAt: 0,
  overviewOpen: false,
  hoveredKey: null,
  hoverSun: false,
  query: '',
  matchKeys: null,
  constellation: false,
  tour: false,
  tourTimer: null,
  tourIndex: 0,
  bootstrapped: false,
  effects: [],
  time: 0,
  lastInteractionAt: 0
};

const nav = {
  followKey: null,
  followReleaseDist: 0,
  followArrived: false,
  recentering: false,
  preset: 'awe',
  tween: null,
  lastFollowPos: null
};

function orbitIdForScore(score) {
  if (score?.isTop5 && Number(score.rank) === 1) return 'sun';
  if (score?.isTop5) return 'top5';
  if (!score?.starred) return 'outer';
  if (score.orbitId === 'tier3' || score.orbitId === 'tier2' || score.orbitId === 'tier1') return score.orbitId;
  if (score.vfxTier >= 3) return 'tier3';
  if (score.vfxTier === 2) return 'tier2';
  return 'tier1';
}

function orbitLabelForPlanet(planet) {
  if (!planet) return '';
  if (planet.isChampion) return '#1 · 恒星王座';
  if (planet.orbitId === 'top5') return `TOP ${planet.rank} · ${TOP5_PALETTE[planet.rank]?.name || '内环'}`;
  return ORBIT_BY_ID[planet.orbitId]?.label || '外缘星带';
}

function allBodies() {
  return scene.champion ? [scene.champion, ...scene.planets] : scene.planets;
}

function omegaForRadius(r) {
  return KEPLER_K / Math.max(120, r) ** 1.5;
}

function freshTagForProfile(profile) {
  const key = profileKey(profile);
  const now = Date.now();
  const entry = key ? state.freshnessByHandle.get(key) : null;
  if (entry && now - entry.markedAt < SESSION_FRESH_TTL_MS) return entry.tag;
  const joinedMs = Date.parse(profile?.joinedAt || '') || 0;
  if (joinedMs > 0 && now - joinedMs >= 0 && now - joinedMs < FRESH_WINDOW_MS) return '刚上墙';
  const cheers = Array.isArray(profile?.cheers) ? profile.cheers : [];
  const cheerMs = cheers.reduce((max, cheer) => Math.max(max, Date.parse(cheer?.ts || '') || 0), 0);
  if (cheerMs > 0 && now - cheerMs >= 0 && now - cheerMs < FRESH_WINDOW_MS) return '刚收寄语';
  return '';
}

function markProfileFresh(key, tag = '刚上墙') {
  const normalized = String(key || '').trim().replace(/\.json$/i, '').toLowerCase();
  if (!normalized) return;
  state.freshnessByHandle.set(normalized, { markedAt: Date.now(), tag });
  window.clearTimeout(state.freshnessCleanupTimer);
  state.freshnessCleanupTimer = window.setTimeout(() => {
    for (const body of allBodies()) body.freshTag = freshTagForProfile(body.profile);
  }, SESSION_FRESH_TTL_MS + 400);
}

function planetSearchText(profile, recipe, orbitId, rank) {
  const cheers = Array.isArray(profile.cheers) ? profile.cheers : [];
  return [
    profile.name,
    profile.github,
    profile.motto,
    profile.city,
    profile.file,
    recipe ? recipe.summary : '',
    orbitId === 'sun' ? '恒星 王座 第一 冠军 champion' : ORBIT_BY_ID[orbitId]?.label,
    rank ? `top${rank} top ${rank}` : '',
    ...cheers.flatMap((cheer) => [cheer.from, cheer.message])
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
}

function syncPlanetsFromContributors(contributors) {
  const prevByKey = scene.planetByKey;
  const groups = Object.fromEntries(ORBITS.map((orbit) => [orbit.id, []]));
  const entries = [];
  let championEntry = null;

  for (const profile of contributors) {
    const key = profileKey(profile);
    if (!key) continue;
    const score = getProfileScore(profile);
    const orbitId = orbitIdForScore(score);
    const entry = { key, profile, score, orbitId, recipe: recipeForProfile(profile) };
    entries.push(entry);
    if (orbitId === 'sun' && !championEntry) championEntry = entry;
    else groups[orbitId === 'sun' ? 'top5' : orbitId].push(entry);
  }

  const nextPlanets = [];
  const nextByKey = new Map();
  let introIndex = 0;

  for (const orbit of ORBITS) {
    const group = groups[orbit.id];
    scene.ringCounts[orbit.id] = group.length;
    if (orbit.id === 'top5') group.sort((a, b) => (a.score.rank || 99) - (b.score.rank || 99));
    else group.sort((a, b) => hashString(a.key, 0x2545f491) - hashString(b.key, 0x2545f491));
    const count = group.length;
    const capacitySize = count ? ((TAU * orbit.r) / count) * 0.28 : Infinity;
    const rankOrderByKey = new Map();
    if (orbit.id === 'tier3' || orbit.id === 'tier2' || orbit.id === 'tier1') {
      group
        .slice()
        .sort((a, b) => (a.score.rank || 9999) - (b.score.rank || 9999) || b.score.points - a.score.points || a.key.localeCompare(b.key))
        .forEach((entry, rankIdx) => rankOrderByKey.set(entry.key, rankIdx));
    }

    group.forEach((entry, index) => {
      const { key, profile, score, recipe } = entry;
      const h = hashString(key, 0x7f4a7c15);
      const jitter = orbit.belt ? (((h % 1000) / 1000) - 0.5) * (TAU / Math.max(count, 1)) * 0.5 : 0;
      const slot = (index / Math.max(count, 1)) * TAU + jitter;
      const radialJitter = orbit.belt ? ((((h >>> 10) % 1000) / 1000) - 0.5) * orbit.belt : 0;
      const yFactor = (((h >>> 20) % 1000) / 1000) - 0.5;
      const verticalJitter = orbit.belt
        ? yFactor * 2600
        : (orbit.id === 'tier1'
          ? yFactor * 360
          : (orbit.id === 'tier2'
            ? yFactor * 240
            : (orbit.id === 'tier3' ? yFactor * 160 : yFactor * 100)));
      const rank = score.isTop5 ? Number(score.rank || 0) : 0;
      let baseSize;
      if (rank) {
        baseSize = TOP5_SIZE[rank] || TOP5_SIZE[5];
      } else if (orbit.id === 'outer') {
        const [minS, maxS] = PLANET_SIZE_RANGE.outer;
        const sizeSeed = (hashString(key, 0x517cc1b7) % 1000) / 1000;
        baseSize = minS + sizeSeed * (maxS - minS);
      } else {
        const [minS, maxS] = PLANET_SIZE_RANGE[orbit.id] || PLANET_SIZE_RANGE.tier1;
        const rankIdx = rankOrderByKey.get(key) ?? 0;
        const t = count > 1 ? rankIdx / (count - 1) : 0;
        baseSize = maxS - t * (maxS - minS);
      }
      const size = Math.max(4.5, Math.min(baseSize, capacitySize));
      const starred = Boolean(score.starred);
      const prev = prevByKey.get(key);
      const reuse = prev && !prev.isChampion ? prev : null;

      const planet = reuse || {
        key,
        angle: scene.ringPhase[orbit.id] + slot,
        r: scene.bootstrapped ? orbit.r + radialJitter : SUN_RADIUS * 1.15,
        y: 0,
        size: 0,
        alpha: 0,
        dim: 1,
        introDelay: scene.bootstrapped ? 0 : 2.2 + introIndex * 0.06,
        born: scene.time,
        hidden: false,
        orbitId: orbit.id,
        prevOrbitId: orbit.id,
        transition: 1,
        pos: new THREE.Vector3(),
        spin: (h % 100) / 100 * TAU
      };
      introIndex += 1;

      if (reuse && reuse.orbitId !== orbit.id) {
        planet.prevOrbitId = reuse.orbitId;
        planet.transition = 0;
      }
      if (prev?.isChampion) {
        planet.r = SUN_RADIUS * 1.45;
        planet.transition = 1;
      }

      let planetRingStyle = null;
      let planetMoonCount = 0;
      if (starred && recipe) {
        const ringGate = hashString(key, 0x4b1d9c37) % 10;
        if (orbit.id === 'top5') {
          const baseRing = recipe.ring;
          if (baseRing.id === 'gossamer' || baseRing.id === 'subtle') {
            planetRingStyle = rank % 2 === 0 ? STAR_RING_STYLES[3] : STAR_RING_STYLES[7];
          } else {
            planetRingStyle = baseRing;
          }
          planetMoonCount = Math.max(1, recipe.moon.count);
        } else if (orbit.id === 'tier3') {
          planetRingStyle = ringGate < 7 ? recipe.ring : null;
          planetMoonCount = Math.max(1, Math.min(2, recipe.moon.count));
        } else if (orbit.id === 'tier2') {
          planetRingStyle = ringGate < 4
            ? { ...(ringGate % 2 === 0 ? STAR_RING_STYLES[2] : STAR_RING_STYLES[5]), opacity: 0.36, dust: 0 }
            : null;
          planetMoonCount = Math.min(2, recipe.moon.count);
        } else if (orbit.id === 'tier1') {
          planetRingStyle = null;
          planetMoonCount = Math.min(1, recipe.moon.count);
        }
      }

      Object.assign(planet, {
        profile,
        score,
        recipe,
        orbitId: orbit.id,
        rank,
        starred,
        isChampion: false,
        slot,
        targetR: orbit.r + radialJitter,
        targetY: verticalJitter,
        targetSize: size,
        color: starred && recipe ? recipe.theme.color : UNSTARRED_COLOR,
        ringColor: starred && recipe ? recipe.theme.ring : '#cbd5e1',
        ringStyle: planetRingStyle,
        moonCount: planetMoonCount,
        moonSpeed: starred && recipe ? recipe.moon.speed : 1,
        freshTag: freshTagForProfile(profile),
        avatarUrl: avatarForProfile(profile, 128),
        searchText: planetSearchText(profile, recipe, orbit.id, rank)
      });

      ensurePlanetObject(planet);
      nextPlanets.push(planet);
      nextByKey.set(key, planet);
    });
  }

  for (const [key, old] of prevByKey) {
    if (!nextByKey.has(key) && !old.isChampion) disposePlanetObject(old);
  }

  // Champion becomes the sun itself.
  if (championEntry) {
    const { key, profile, score, recipe } = championEntry;
    const champion = {
      key,
      profile,
      score,
      recipe,
      orbitId: 'sun',
      rank: 1,
      starred: true,
      isChampion: true,
      color: '#ffd166',
      ringColor: '#fff3b0',
      size: SUN_RADIUS,
      pos: new THREE.Vector3(0, 0, 0),
      dim: 1,
      alpha: 1,
      freshTag: freshTagForProfile(profile),
      avatarUrl: avatarForProfile(profile, 256),
      searchText: planetSearchText(profile, recipe, 'sun', 1),
      labelEl: scene.champion?.labelEl
    };
    const previous = scene.champion?.key;
    scene.champion = champion;
    nextByKey.set(key, champion);
    setSunChampion(champion, previous && previous !== key);
  } else {
    scene.champion = null;
    setSunChampion(null, false);
  }

  scene.planets = nextPlanets;
  scene.planetByKey = nextByKey;
  buildLinks(entries);
  scene.bootstrapped = true;
  updateOrbitEmphasis();

  if (scene.selectedKey && !nextByKey.has(scene.selectedKey)) closePlanetCard({ keepFollow: false, keepLock: false });
  if (scene.lockedKey && !nextByKey.has(scene.lockedKey)) {
    scene.lockedKey = null;
    scene.lockedAt = 0;
  }
  if (nav.followKey && !nextByKey.has(nav.followKey)) stopFollowing();
  applySearchFilter();
}

function buildLinks(entries) {
  const links = new Map();
  const byKey = new Set(entries.map((e) => e.key));
  for (const { key: toKey, profile } of entries) {
    for (const cheer of Array.isArray(profile.cheers) ? profile.cheers : []) {
      const fromKey = String(cheer?.from || '').trim().toLowerCase();
      if (!fromKey || fromKey === toKey || !byKey.has(fromKey)) continue;
      const id = `cheer:${fromKey}>${toKey}`;
      const existing = links.get(id);
      if (existing) existing.count += 1;
      else links.set(id, { id, type: 'cheer', fromKey, toKey, count: 1, seed: (hashString(id) % 1000) / 1000 });
    }
  }
  for (const { key, score } of entries) {
    for (const partner of score?.breakdown?.pairPartners || []) {
      const partnerKey = String(partner || '').trim().toLowerCase();
      if (!partnerKey || partnerKey === key || !byKey.has(partnerKey)) continue;
      const [a, b] = [key, partnerKey].sort();
      const id = `pair:${a}<>${b}`;
      if (!links.has(id)) links.set(id, { id, type: 'pair', fromKey: a, toKey: b, count: 1, seed: (hashString(id) % 1000) / 1000 });
    }
  }
  scene.links = Array.from(links.values());
  scene.linksByKey = new Map();
  for (const link of scene.links) {
    for (const k of [link.fromKey, link.toKey]) {
      if (!scene.linksByKey.has(k)) scene.linksByKey.set(k, []);
      scene.linksByKey.get(k).push(link);
    }
  }
}

function linkedKeysOf(key) {
  const set = new Set();
  for (const link of scene.linksByKey.get(key) || []) set.add(link.fromKey === key ? link.toKey : link.fromKey);
  return set;
}

/* ===================================================== procedural textures */

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function makeValueNoise(seed) {
  const N = 256;
  const rand = seededRandom(seed);
  const grid = new Float32Array(N * N);
  for (let i = 0; i < grid.length; i += 1) grid[i] = rand();
  // period-aware lookup → seamless in x for equirect textures
  const noise = (x, y, period) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const px = (i) => ((i % period) + period) % period;
    const g = (i, j) => grid[(((j % N) + N) % N) * N + px(i)];
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = g(xi, yi) + (g(xi + 1, yi) - g(xi, yi)) * u;
    const b = g(xi, yi + 1) + (g(xi + 1, yi + 1) - g(xi, yi + 1)) * u;
    return a + (b - a) * v;
  };
  return (u, v, base = 8, octaves = 4) => {
    let sum = 0;
    let amp = 0.5;
    let freq = base;
    for (let o = 0; o < octaves; o += 1) {
      sum += amp * noise(u * freq, v * freq * 0.5, freq);
      freq *= 2;
      amp *= 0.5;
    }
    return sum / (1 - 0.5 ** octaves);
  };
}

function mixRgb(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function lighten(rgb, amount) {
  return amount >= 0 ? mixRgb(rgb, [255, 255, 255], amount) : mixRgb(rgb, [0, 0, 0], -amount);
}

function canvasTexture(canvas, { srgb = true, repeat = false } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  if (repeat) texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function smoothstep01(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function gasGiantCanvas(hex, seedKey, width = 512, height = 256, opts = {}) {
  const canvas = makeCanvas(width, height);
  const g = canvas.getContext('2d');
  const img = g.createImageData(width, height);
  const data = img.data;
  const seed = hashString(seedKey, 0x51ed270b);
  const fbm = makeValueNoise(seed);
  const rand = seededRandom(seed ^ 0x9e37);
  const base = hexToRgb(hex);
  const dark = lighten(base, -0.52);
  const light = lighten(base, 0.46);
  const accent = lighten(hexToRgb(opts.accent || hex), 0.16);
  const bands = 7 + Math.floor(rand() * 7);
  const phase = rand() * TAU;
  const turbulence = 0.65 + rand() * 0.85;
  const dr = dark[0]; const dg = dark[1]; const db = dark[2];
  const lr = light[0]; const lg = light[1]; const lb = light[2];
  const ar = accent[0]; const ag = accent[1]; const ab = accent[2];

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    const polar = Math.abs(v - 0.5) * 2;
    const polarDark = Math.max(0, polar - 0.74) * 1.55;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const warp = fbm(u, v, 4, 4) * turbulence;
      const t = v * bands + warp * 1.65;
      const band = 0.5 + 0.5 * Math.sin(t * TAU * 0.5 + phase);
      const eddy = 0.5 + 0.5 * Math.sin(t * TAU * 1.45 - warp * 3.2 + phase);
      const fine = fbm(u, v * 4, 16, 3);
      const mixT = band * 0.72 + eddy * 0.14 + fine * 0.14;
      let r = dr + (lr - dr) * mixT;
      let gc = dg + (lg - dg) * mixT;
      let b = db + (lb - db) * mixT;
      const acc = Math.max(0, Math.sin(t * 3.1 + phase) - 0.68) * 1.15;
      if (acc > 0) {
        r += (ar - r) * acc;
        gc += (ag - gc) * acc;
        b += (ab - b) * acc;
      }
      if (polarDark > 0) {
        const pd = Math.min(1, polarDark);
        r += (dr - r) * pd;
        gc += (dg - gc) * pd;
        b += (db - b) * pd;
      }
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = gc;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const stormCount = opts.rich ? 2 : (rand() < 0.85 ? 1 : 0);
  for (let s = 0; s < stormCount; s += 1) {
    const sx = (0.15 + rand() * 0.7) * width;
    const sy = height * (0.28 + rand() * 0.44);
    const sw = width * (0.05 + rand() * 0.05);
    const grad = g.createRadialGradient(sx, sy, 0, sx, sy, sw);
    grad.addColorStop(0, `rgba(${light.map(Math.round).join(',')}, 0.88)`);
    grad.addColorStop(0.55, `rgba(${accent.map(Math.round).join(',')}, 0.52)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.save();
    g.translate(sx, sy);
    g.scale(1.85, 0.72);
    g.translate(-sx, -sy);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(sx, sy, sw, 0, TAU);
    g.fill();
    g.restore();
  }
  return canvas;
}

function terrestrialCanvas(hex, seedKey, width = 512, height = 256) {
  const canvas = makeCanvas(width, height);
  const g = canvas.getContext('2d');
  const img = g.createImageData(width, height);
  const data = img.data;
  const seed = hashString(seedKey, 0x2c9277b5);
  const fbm = makeValueNoise(seed);
  const cloudFbm = makeValueNoise(seed ^ 0x4f1bbcdc);
  const rand = seededRandom(seed ^ 0x1357);
  const base = hexToRgb(hex);
  const deepSea = mixRgb([12, 38, 88], base, 0.16);
  const shallowSea = mixRgb([34, 128, 178], base, 0.22);
  const lowland = mixRgb([62, 134, 92], base, 0.34);
  const desert = mixRgb([178, 146, 98], base, 0.22);
  const alpine = mixRgb([166, 162, 156], lighten(base, 0.24), 0.26);
  const seaLevel = 0.49 + (rand() - 0.5) * 0.05;
  const cloudDrift = rand();

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    const polar = Math.abs(v - 0.5) * 2;
    const aridBelt = Math.exp(-((polar - 0.32) ** 2) / 0.045);
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const elev = fbm(u, v, 5, 5) * 0.72 + fbm(u, v * 1.5, 10, 3) * 0.28;
      let r; let gc; let b;
      if (elev < seaLevel) {
        const depth = smoothstep01(seaLevel - 0.2, seaLevel, elev);
        r = deepSea[0] + (shallowSea[0] - deepSea[0]) * depth;
        gc = deepSea[1] + (shallowSea[1] - deepSea[1]) * depth;
        b = deepSea[2] + (shallowSea[2] - deepSea[2]) * depth;
      } else {
        const relief = smoothstep01(seaLevel, seaLevel + 0.26, elev);
        const moisture = clamp(aridBelt * 0.75 * (1 - relief * 0.6), 0, 1);
        const lr = lowland[0] + (desert[0] - lowland[0]) * moisture;
        const lg = lowland[1] + (desert[1] - lowland[1]) * moisture;
        const lb = lowland[2] + (desert[2] - lowland[2]) * moisture;
        r = lr + (alpine[0] - lr) * relief;
        gc = lg + (alpine[1] - lg) * relief;
        b = lb + (alpine[2] - lb) * relief;
      }
      const ice = smoothstep01(0.76, 0.9, polar + (elev - 0.5) * 0.18);
      if (ice > 0) {
        r += (238 - r) * ice;
        gc += (246 - gc) * ice;
        b += (255 - b) * ice;
      }
      const cloudNoise = cloudFbm((u + cloudDrift) % 1, v * 1.4, 6, 4);
      const clouds = clamp((cloudNoise - 0.56) * 2.1, 0, 0.62);
      if (clouds > 0) {
        r += (246 - r) * clouds;
        gc += (250 - gc) * clouds;
        b += (255 - b) * clouds;
      }
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = gc;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

function iceGiantCanvas(hex, seedKey, width = 512, height = 256, opts = {}) {
  const canvas = makeCanvas(width, height);
  const g = canvas.getContext('2d');
  const img = g.createImageData(width, height);
  const data = img.data;
  const seed = hashString(seedKey, 0x6f2d9b41);
  const fbm = makeValueNoise(seed);
  const rand = seededRandom(seed ^ 0x7a2b);
  const base = hexToRgb(hex);
  const accent = hexToRgb(opts.accent || hex);
  const cyan = mixRgb([76, 208, 238], base, 0.32);
  const indigo = mixRgb([56, 78, 174], base, 0.34);
  const violet = mixRgb([144, 118, 224], accent, 0.36);
  const polarCap = mixRgb([40, 52, 128], indigo, 0.4);
  const bands = 4 + Math.floor(rand() * 4);
  const phase = rand() * TAU;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    const polar = Math.abs(v - 0.5) * 2;
    const vortexRing = Math.exp(-((polar - 0.74) ** 2) / 0.0028) * 0.42;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const swirl = fbm(u, v, 4, 4) * 0.4;
      const t = v * bands + swirl;
      const w1 = 0.5 + 0.5 * Math.sin(t * TAU * 0.5 + phase);
      const w2 = (0.5 + 0.5 * Math.cos(t * TAU * 0.35 - phase * 0.7)) * 0.44;
      let r = indigo[0] + (cyan[0] - indigo[0]) * w1;
      let gc = indigo[1] + (cyan[1] - indigo[1]) * w1;
      let b = indigo[2] + (cyan[2] - indigo[2]) * w1;
      r += (violet[0] - r) * w2;
      gc += (violet[1] - gc) * w2;
      b += (violet[2] - b) * w2;
      const wisp = smoothstep01(0.68, 0.86, fbm((u + 0.15) % 1, v * 2.2, 8, 3)) * 0.38;
      if (wisp > 0) {
        r += (224 - r) * wisp;
        gc += (244 - gc) * wisp;
        b += (255 - b) * wisp;
      }
      if (vortexRing > 0) {
        r += (196 - r) * vortexRing;
        gc += (236 - gc) * vortexRing;
        b += (255 - b) * vortexRing;
      }
      const vortexCore = smoothstep01(0.76, 0.96, polar + (swirl - 0.2) * 0.22) * 0.8;
      if (vortexCore > 0) {
        r += (polarCap[0] - r) * vortexCore;
        gc += (polarCap[1] - gc) * vortexCore;
        b += (polarCap[2] - b) * vortexCore;
      }
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = gc;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

function rockyCanvas(seedKey, width = 256, height = 128) {
  const canvas = makeCanvas(width, height);
  const g = canvas.getContext('2d');
  const img = g.createImageData(width, height);
  const seed = hashString(seedKey, 0x3c6ef372);
  const fbm = makeValueNoise(seed);
  const rand = seededRandom(seed);
  const tint = [128 + rand() * 30, 128 + rand() * 24, 136 + rand() * 30];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const n = fbm(x / width, y / height, 8, 5);
      const m = fbm(x / width, y / height, 3, 2);
      const c = lighten(tint, (n - 0.5) * 1.1 + (m - 0.5) * 0.5);
      const i = (y * width + x) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < 26; k += 1) {
    const cx = rand() * width;
    const cy = height * (0.15 + rand() * 0.7);
    const cr = 2 + rand() * 9;
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, cr);
    grad.addColorStop(0, 'rgba(30, 32, 40, 0.5)');
    grad.addColorStop(0.75, 'rgba(40, 42, 50, 0.25)');
    grad.addColorStop(0.92, 'rgba(230, 230, 240, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, cr, 0, TAU);
    g.fill();
  }
  return canvas;
}

function ringCanvas(seedKey, styleOrWidth = 'single', bandIdx = 0, width = 1024) {
  let styleId = 'single';
  let w = width;
  if (typeof styleOrWidth === 'number') w = styleOrWidth;
  else if (typeof styleOrWidth === 'string') styleId = styleOrWidth;

  const canvas = makeCanvas(w, 16);
  const g = canvas.getContext('2d');
  const rand = seededRandom(hashString(`${seedKey}:${styleId}:${bandIdx}`, 0x1b873593));
  const img = g.createImageData(w, 16);
  const data = img.data;
  const finePhase = rand() * TAU;

  for (let x = 0; x < w; x += 1) {
    const t = x / w;
    const edge = smoothstep01(0, 0.055, t) * smoothstep01(1, 0.94, t);
    let a = 0.5;
    let warm = 0.5;

    if (styleId === 'single') {
      const cassini = 1 - 0.94 * Math.exp(-((t - 0.58) ** 2) / 0.00055);
      const encke = 1 - 0.85 * Math.exp(-((t - 0.84) ** 2) / 0.00018);
      const zone = t < 0.56 ? 0.84 : 0.62;
      const micro = 0.72 + 0.28 * Math.sin(t * 96 + finePhase) * Math.cos(t * 23);
      a = zone * micro * cassini * encke;
      warm = t < 0.56 ? 0.72 : 0.28;
    } else if (styleId === 'double') {
      const freq = bandIdx === 0 ? 78 : 112;
      const wave = 0.6 + 0.4 * Math.sin(t * freq + finePhase);
      const microGap = bandIdx === 0 ? 1 : (1 - 0.75 * Math.exp(-((t - 0.45) ** 2) / 0.0004));
      a = (bandIdx === 0 ? 0.88 : 0.74) * wave * microGap;
      warm = bandIdx === 0 ? 0.85 : 0.2;
    } else if (styleId === 'gossamer') {
      const r1 = Math.exp(-((t - 0.22) ** 2) / 0.00035);
      const r2 = Math.exp(-((t - 0.48) ** 2) / 0.00028);
      const r3 = Math.exp(-((t - 0.72) ** 2) / 0.00032);
      const r4 = Math.exp(-((t - 0.88) ** 2) / 0.00022);
      a = 0.14 + 0.86 * Math.min(1, r1 + r2 * 0.9 + r3 * 0.85 + r4 * 0.7);
      warm = 0.22;
    } else if (styleId === 'broad') {
      const cRing = t < 0.22 ? 0.34 : 1.0;
      const cassini = 1 - 0.95 * Math.exp(-((t - 0.62) ** 2) / 0.00065);
      const striations = 0.72 + 0.28 * Math.sin(t * 140 + finePhase) * Math.sin(t * 34);
      a = cRing * striations * cassini * (0.68 + 0.32 * Math.sin(t * 11));
      warm = t < 0.6 ? 0.76 : 0.34;
    } else if (styleId === 'braided') {
      const edgeBright = Math.exp(-((t - 0.16) ** 2) / 0.0012) + Math.exp(-((t - 0.84) ** 2) / 0.0012);
      const ringlets = 0.48 + 0.52 * Math.abs(Math.sin(t * 68 + finePhase));
      a = Math.min(1, 0.38 * ringlets + 0.62 * edgeBright);
      warm = bandIdx === 0 ? 0.62 : 0.4;
    } else if (styleId === 'subtle') {
      const arch = Math.sin(t * Math.PI);
      const core = Math.exp(-((t - 0.52) ** 2) / 0.025);
      a = (0.35 * arch + 0.65 * core) * (0.82 + 0.18 * Math.sin(t * 50 + finePhase));
      warm = 0.3;
    } else if (styleId === 'dusty') {
      const velvet = (1 - t * 0.38) * (0.76 + 0.24 * Math.sin(t * 48 + finePhase));
      const softGap = 1 - 0.65 * Math.exp(-((t - 0.52) ** 2) / 0.0015);
      a = velvet * softGap;
      warm = 1 - t * 0.75;
    } else {
      const bandProfile = bandIdx === 0 ? 0.48 : (bandIdx === 1 ? 0.92 : 0.72);
      const micro = 0.66 + 0.34 * Math.sin(t * (70 + bandIdx * 36) + finePhase);
      const gap = bandIdx === 1 ? (1 - 0.85 * Math.exp(-((t - 0.55) ** 2) / 0.0005)) : 1;
      a = bandProfile * micro * gap;
      warm = bandIdx === 0 ? 0.75 : (bandIdx === 1 ? 0.52 : 0.22);
    }

    a = clamp(a * edge, 0, 1);
    const r = Math.round(212 + warm * 40);
    const gc = Math.round(218 + warm * 24);
    const b = Math.round(246 - warm * 38);
    const alphaByte = Math.round(a * 255);
    for (let y = 0; y < 16; y += 1) {
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = gc;
      data[i + 2] = b;
      data[i + 3] = alphaByte;
    }
  }
  g.putImageData(img, 0, 0);
  return canvas;
}

function radialGlowCanvas(stops, size = 256) {
  const canvas = makeCanvas(size, size);
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => grad.addColorStop(offset, color));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return canvas;
}

function coronaCanvas(size = 1024) {
  const canvas = makeCanvas(size, size);
  const c = canvas.getContext('2d');
  const rand = seededRandom(0x50de);
  c.save();
  c.translate(size / 2, size / 2);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 64; i += 1) {
    const a = rand() * TAU;
    const len = size * (0.26 + rand() * 0.24);
    const wid = 0.012 + rand() * 0.048;
    const grad = c.createRadialGradient(0, 0, size * 0.16, 0, 0, len);
    grad.addColorStop(0, 'rgba(255, 190, 100, 0)');
    grad.addColorStop(0.28, 'rgba(255, 200, 118, 0.34)');
    grad.addColorStop(0.62, 'rgba(255, 150, 62, 0.1)');
    grad.addColorStop(1, 'rgba(255, 120, 40, 0)');
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, len, a - wid, a + wid);
    c.closePath();
    c.fill();
  }
  // Hollow out the center disc so additive corona rays never wash out the photosphere.
  c.globalCompositeOperation = 'destination-out';
  const mask = c.createRadialGradient(0, 0, 0, 0, 0, size * 0.24);
  mask.addColorStop(0, 'rgba(0, 0, 0, 1)');
  mask.addColorStop(0.68, 'rgba(0, 0, 0, 0.94)');
  mask.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = mask;
  c.beginPath();
  c.arc(0, 0, size * 0.24, 0, TAU);
  c.fill();
  c.restore();
  return canvas;
}

/* ================================================================== world */

const world = {
  ok: false,
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  composer: null,
  bloom: null,
  clock: new THREE.Clock(),
  root: null,
  sun: null,
  orbits: new Map(),
  belt: null,
  background: null,
  links: null,
  textures: {}
};

const SPHERE_GEO = new THREE.SphereGeometry(1, 64, 40);
const SHOCK_GEO = new THREE.RingGeometry(0.94, 1, 128).rotateX(-Math.PI / 2);
const textureCache = new Map();

const fresnelVertex = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

function atmosphereMaterial(hex, intensity = 1, power = 2.6) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(hex) }, intensity: { value: intensity }, power: { value: power } },
    vertexShader: fresnelVertex,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      uniform float power;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float f = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), power);
        gl_FragColor = vec4(color * f * intensity, f * intensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

const planetAtmoVertex = `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

function planetBackAtmosphereMaterial(hex, intensity = 0.72, power = 2.4, limbPeak = 0.36) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(hex) },
      intensity: { value: intensity },
      power: { value: power },
      limbPeak: { value: limbPeak }
    },
    vertexShader: planetAtmoVertex,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      uniform float power;
      uniform float limbPeak;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        float d = clamp(dot(-normalize(vNormal), normalize(vView)), 0.0, 1.0);
        float rim = pow(clamp(d / max(0.05, limbPeak), 0.0, 1.0), power);
        float sunDot = dot(normalize(vWorldNormal), normalize(-vWorldPos));
        float dayLit = 0.12 + 0.88 * smoothstep(-0.35, 0.55, sunDot);
        float alpha = rim * intensity * dayLit;
        gl_FragColor = vec4(color * alpha, alpha);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

function planetFrontAtmosphereMaterial(hex, intensity = 0.28, power = 4.2) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(hex) },
      intensity: { value: intensity },
      power: { value: power }
    },
    vertexShader: planetAtmoVertex,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      uniform float power;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      void main() {
        float f = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), power);
        float sunDot = dot(normalize(vWorldNormal), normalize(-vWorldPos));
        float dayLit = 0.08 + 0.92 * smoothstep(-0.3, 0.5, sunDot);
        float alpha = f * intensity * dayLit;
        gl_FragColor = vec4(color * alpha, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

function planetRingMaterial(texture, colorHex, opacity = 0.78) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      color: { value: new THREE.Color(colorHex) },
      opacity: { value: opacity },
      uDim: { value: 1.0 },
      uTime: { value: 0 },
      uPlanetPos: { value: new THREE.Vector3() },
      uPlanetRadius: { value: 100 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 color;
      uniform float opacity;
      uniform float uDim;
      uniform float uTime;
      uniform vec3 uPlanetPos;
      uniform float uPlanetRadius;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vec4 tex = texture2D(map, vUv);
        if (tex.a < 0.01) discard;
        vec3 toSun = normalize(-vWorldPos);
        vec3 toPlanet = uPlanetPos - vWorldPos;
        float proj = dot(toPlanet, toSun);
        float shadow = 1.0;
        if (proj > 0.0) {
          float perp = length(toPlanet - toSun * proj);
          shadow = mix(0.08, 1.0, smoothstep(uPlanetRadius * 0.96, uPlanetRadius * 1.05, perp));
        }
        float sparkle = 1.0 + 0.06 * sin(vWorldPos.x * 0.05 + vWorldPos.z * 0.05 + uTime * 0.7);
        vec3 sunTint = vec3(1.02, 0.99, 0.95);
        vec3 rgb = tex.rgb * color * sunTint * (0.1 + 0.9 * shadow) * sparkle * uDim;
        float alpha = tex.a * opacity * uDim;
        gl_FragColor = vec4(rgb, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
}

function planetRingDustMaterial(colorHex, opacity = 0.75) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(colorHex) },
      opacity: { value: opacity },
      uDim: { value: 1.0 },
      uPlanetPos: { value: new THREE.Vector3() },
      uPlanetRadius: { value: 100 }
    },
    vertexShader: `
      attribute float aSize;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vec4 mv = viewMatrix * wp;
        gl_PointSize = clamp(aSize * (1600.0 / max(1.0, -mv.z)), 1.4, 5.2);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float uDim;
      uniform vec3 uPlanetPos;
      uniform float uPlanetRadius;
      varying vec3 vWorldPos;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5)) * 2.0;
        if (dist > 1.0) discard;
        float soft = pow(1.0 - dist, 1.6);
        vec3 toSun = normalize(-vWorldPos);
        vec3 toPlanet = uPlanetPos - vWorldPos;
        float proj = dot(toPlanet, toSun);
        float shadow = 1.0;
        if (proj > 0.0) {
          float perp = length(toPlanet - toSun * proj);
          shadow = mix(0.08, 1.0, smoothstep(uPlanetRadius * 0.96, uPlanetRadius * 1.05, perp));
        }
        float alpha = soft * opacity * (0.16 + 0.84 * shadow) * uDim;
        gl_FragColor = vec4(color * (0.2 + 0.8 * shadow) * uDim, alpha);
      }
    `,
    transparent: true,
    depthWrite: false
  });
}

const NOISE_GLSL = `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }
`;

function orbitQuaternion(orbit) {
  const qNode = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), orbit.node);
  const qIncl = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), orbit.incl);
  return qNode.multiply(qIncl);
}

const _local = new THREE.Vector3();
function orbitPosition(orbitId, angle, radius, y, out) {
  const orbit = world.orbits.get(orbitId);
  _local.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  if (orbit) _local.applyQuaternion(orbit.quat);
  return out.copy(_local);
}

function initWorld() {
  const canvas = elements.canvas;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    if (elements.webglFallback) elements.webglFallback.hidden = false;
    console.warn('WebGL unavailable', error);
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const bgScene = new THREE.Scene();
  bgScene.background = new THREE.Color(0x010207);
  const s3 = new THREE.Scene();
  s3.background = null;
  const camera = new THREE.PerspectiveCamera(fovForAspect(window.innerWidth / window.innerHeight), window.innerWidth / window.innerHeight, 0.6, 750000);
  camera.position.set(...CAMERA_PRESETS.gaze.position);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 1.25;
  controls.panSpeed = 1.15;
  controls.screenSpacePanning = true;
  controls.minDistance = 24;
  controls.maxDistance = 580000;
  controls.autoRotateSpeed = 0.14;
  controls.target.set(...CAMERA_PRESETS.gaze.target);
  controls.addEventListener('start', () => {
    nav.tween = null;
    controls.autoRotate = false;
    markInteraction();
    if (scene.tour) setTour(false);
  });

  s3.add(new THREE.AmbientLight(0x404d72, 0.55));
  s3.add(new THREE.HemisphereLight(0x8899e8, 0x120c10, 0.25));

  const root = new THREE.Group();
  s3.add(root);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(bgScene, camera));
  const mainPass = new RenderPass(s3, camera);
  mainPass.clear = false;
  mainPass.clearDepth = true;
  composer.addPass(mainPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.46, 0.42, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  Object.assign(world, { ok: true, renderer, bgScene, scene: s3, camera, controls, composer, bloom, root });

  buildBackground();
  buildSun();
  buildOrbits();
  buildBelt();
  buildLinkLayer();
  return true;
}

// Keep the horizontal field of view generous on portrait screens.
function fovForAspect(aspect) {
  if (aspect >= 1.25) return 45;
  const hfov = 2 * Math.atan(Math.tan((45 * Math.PI) / 360) * 1.25);
  return Math.min(82, (2 * Math.atan(Math.tan(hfov / 2) / aspect) * 180) / Math.PI);
}

function resizeWorld() {
  if (!world.ok) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  world.renderer.setSize(w, h, false);
  world.camera.aspect = w / h;
  world.camera.fov = fovForAspect(w / h);
  world.camera.updateProjectionMatrix();
  world.composer.setSize(w, h);
}

/* ------------------------------------------------------------ background */

function buildBackground() {
  const bg = new THREE.Group();
  world.bgScene.add(bg);

  // Colossal ringed world and distant galaxies framing our tiny solar system.
  const abyss = buildAbyss(bg, { gasGiantCanvas, ringCanvas, canvasTexture, remapRingUVs });

  // Near-field dust for parallax depth
  const dustCount = 3800;
  const dustPos = new Float32Array(dustCount * 3);
  const drand = seededRandom(0xd057);
  for (let i = 0; i < dustCount; i += 1) {
    const r = 3200 + drand() ** 0.65 * 56000;
    const th = drand() * TAU;
    dustPos[i * 3] = Math.cos(th) * r;
    dustPos[i * 3 + 1] = (drand() + drand() - 1) * 9500;
    dustPos[i * 3 + 2] = Math.sin(th) * r;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0x9fb4ff,
    map: canvasTexture(radialGlowCanvas([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']], 64)),
    size: 38,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  world.scene.add(dust);

  world.background = { group: bg, abyss, dust };
}

function remapRingUVs(geometry, inner, outer) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  uv.needsUpdate = true;
}

/* ------------------------------------------------------------------- sun */

function buildSun() {
  const group = new THREE.Group();
  world.root.add(group);

  const placeholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  placeholder.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      avatar: { value: placeholder },
      avatarMix: { value: 0 },
      heat: { value: 1 }
    },
    vertexShader: `
      varying vec3 vPos;
      varying vec3 vNormalView;
      void main() {
        vPos = normalize(position);
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform sampler2D avatar;
      uniform float avatarMix;
      uniform float heat;
      varying vec3 vPos;
      varying vec3 vNormalView;
      ${NOISE_GLSL}
      void main() {
        vec3 p = vPos;
        float n1 = fbm3(p * 4.5 + vec3(0.0, time * 0.032, time * 0.018));
        float n2 = fbm3(p * 12.0 + n1 * 2.4 - vec3(time * 0.055));
        float gran = fbm3(p * 24.0 - vec3(time * 0.08));
        float cells = smoothstep(0.32, 0.84, n2 * 0.72 + gran * 0.28);
        float lanes = smoothstep(0.18, 0.44, n2);
        float h = clamp(n1 * 0.48 + cells * 0.52, 0.0, 1.0);
        vec3 col = mix(vec3(0.42, 0.08, 0.01), vec3(0.96, 0.48, 0.10), lanes);
        col = mix(col, vec3(1.0, 0.74, 0.24), h);
        col = mix(col, vec3(1.0, 0.94, 0.74), pow(h, 3.2) * 0.85);
        float mu = clamp(vNormalView.z, 0.0, 1.0);
        col *= 0.26 + 0.74 * pow(mu, 0.58);
        col += pow(1.0 - mu, 4.5) * vec3(1.15, 0.45, 0.08) * 0.65;
        vec2 auv = vNormalView.xy * 0.78 + 0.5;
        float mask = smoothstep(0.64, 0.42, length(vNormalView.xy));
        vec3 av = pow(texture2D(avatar, auv).rgb, vec3(2.2));
        vec3 portrait = col * 0.32 + av * vec3(1.05, 0.88, 0.72);
        col = mix(col, portrait, mask * avatarMix);
        gl_FragColor = vec4(col * 0.96 * heat, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(SUN_RADIUS, 128, 64), material);
  mesh.userData.isSun = true;
  group.add(mesh);

  const halo = new THREE.Mesh(SPHERE_GEO, atmosphereMaterial('#ff7b24', 1.15, 3.2));
  halo.scale.setScalar(SUN_RADIUS * 1.11);
  group.add(halo);

  const spriteMat = (canvas, opacity) => new THREE.SpriteMaterial({
    map: canvasTexture(canvas),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Sprite(spriteMat(radialGlowCanvas([
    [0, 'rgba(255, 190, 100, 0)'],
    [0.36, 'rgba(255, 180, 90, 0.04)'],
    [0.5, 'rgba(255, 170, 76, 0.85)'],
    [0.64, 'rgba(255, 124, 44, 0.34)'],
    [0.84, 'rgba(255, 86, 26, 0.08)'],
    [1, 'rgba(255, 70, 20, 0)']
  ]), 0.42));
  glow.scale.setScalar(SUN_RADIUS * 4.0);
  group.add(glow);

  const corona = new THREE.Sprite(spriteMat(coronaCanvas(), 0.72));
  corona.scale.setScalar(SUN_RADIUS * 3.8);
  group.add(corona);
  const corona2 = new THREE.Sprite(spriteMat(coronaCanvas(), 0.45));
  corona2.scale.setScalar(SUN_RADIUS * 3.1);
  corona2.material.rotation = 1.3;
  group.add(corona2);

  const haze = new THREE.Sprite(spriteMat(radialGlowCanvas([
    [0, 'rgba(255, 140, 60, 0.03)'],
    [0.14, 'rgba(255, 145, 65, 0.22)'],
    [0.38, 'rgba(150, 70, 60, 0.06)'],
    [1, 'rgba(40, 20, 30, 0)']
  ]), 0.24));
  haze.scale.setScalar(SUN_RADIUS * 9.5);
  group.add(haze);

  const light = new THREE.PointLight(0xfff1dc, 4.6, 0, 0);
  group.add(light);

  // Throne disk: golden particles + banded ring, tilted, only when a champion reigns.
  const disk = new THREE.Group();
  disk.rotation.set(0.42, 0, -0.18);
  group.add(disk);
  const ringGeo = new THREE.RingGeometry(SUN_RADIUS * 1.28, SUN_RADIUS * 1.66, 256, 1);
  remapRingUVs(ringGeo, SUN_RADIUS * 1.28, SUN_RADIUS * 1.66);
  ringGeo.rotateX(-Math.PI / 2);
  const throneRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    map: canvasTexture(ringCanvas('throne', 1024)),
    color: new THREE.Color('#ffcf7a'),
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  disk.add(throneRing);

  const pCount = 4200;
  const pPos = new Float32Array(pCount * 3);
  const prand = seededRandom(0x7407);
  for (let i = 0; i < pCount; i += 1) {
    const r = SUN_RADIUS * (1.24 + prand() ** 1.4 * 0.54);
    const a = prand() * TAU;
    pPos[i * 3] = Math.cos(a) * r;
    pPos[i * 3 + 1] = (prand() - 0.5) * SUN_RADIUS * 0.12;
    pPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xffc46b,
    map: canvasTexture(radialGlowCanvas([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']], 64)),
    size: 26,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  disk.add(particles);

  world.sun = { group, mesh, material, halo, glow, corona, corona2, haze, light, disk, throneRing, particles, avatarUrl: '', heatPulse: 0 };
}

const avatarTextureLoader = new THREE.TextureLoader();
avatarTextureLoader.setCrossOrigin('anonymous');

function setSunChampion(champion, changed) {
  const sun = world.sun;
  if (!sun) return;
  sun.targetRing = champion ? 0.55 : 0;
  sun.targetParticles = champion ? 0.75 : 0.3;
  if (!champion) {
    sun.targetAvatarMix = 0;
    sun.avatarUrl = '';
    return;
  }
  if (changed) sun.heatPulse = 1;
  if (sun.avatarUrl === champion.avatarUrl) return;
  sun.avatarUrl = champion.avatarUrl;
  sun.targetAvatarMix = 0;
  avatarTextureLoader.load(champion.avatarUrl, (texture) => {
    if (sun.avatarUrl !== champion.avatarUrl) return;
    texture.colorSpace = THREE.NoColorSpace;
    sun.material.uniforms.avatar.value = texture;
    sun.targetAvatarMix = 0.55;
  }, undefined, () => {
    sun.targetAvatarMix = 0;
  });
}

/* ---------------------------------------------------------------- orbits */

const ORBIT_BASE_CORE = { top5: 0.92, tier3: 0.78, tier2: 0.68, tier1: 0.56, outer: 0.42 };
const ORBIT_BASE_SHEET = { top5: 0.08, tier3: 0.055, tier2: 0.045, tier1: 0.032, outer: 0.042 };

function orbitSheetMaterial(hex, { corePx = 1.35, sheetVar = 260000, style = 0 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(hex) },
      radius: { value: 1 },
      core: { value: 0.5 },
      sheet: { value: 0.05 },
      corePx: { value: corePx },
      sheetVar: { value: sheetVar },
      style: { value: style }
    },
    vertexShader: `
      varying vec2 vXZ;
      varying float vViewDist;
      void main() {
        vXZ = position.xz;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float radius;
      uniform float core;
      uniform float sheet;
      uniform float corePx;
      uniform float sheetVar;
      uniform float style;
      varying vec2 vXZ;
      varying float vViewDist;
      void main() {
        float signedD = length(vXZ) - radius;
        float d = abs(signedD);
        float nearFade = smoothstep(360.0, 3400.0, vViewDist);
        float pxWorld = max(22.0, vViewDist * 0.00095);
        float sigma = pxWorld * corePx;
        float coreBand = exp(-(d * d) / (2.0 * sigma * sigma));
        float sheetBand = exp(-(d * d) / sheetVar);
        float pattern = coreBand;
        if (style < 0.5) {
          float railOffset = max(95.0, pxWorld * 4.2);
          float railSigma = pxWorld * 0.85;
          float rails = 0.38 * exp(-pow(abs(d - railOffset), 2.0) / (2.0 * railSigma * railSigma));
          pattern = coreBand + rails;
        } else if (style < 1.5) {
          float shoulderSigma = pxWorld * 2.8;
          pattern = coreBand + 0.24 * exp(-(d * d) / (2.0 * shoulderSigma * shoulderSigma));
        } else if (style > 3.5) {
          float edgeSigma = pxWorld * 1.4;
          float edgeD = min(abs(signedD - 1150.0), abs(signedD + 1150.0));
          pattern = 0.45 * coreBand + 0.22 * exp(-(edgeD * edgeD) / (2.0 * edgeSigma * edgeSigma));
        }
        float a = (core * pattern + sheet * sheetBand) * nearFade;
        gl_FragColor = vec4(color * a, a);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

function buildOrbits() {
  const corePxByStyle = [1.65, 1.45, 1.30, 1.15, 1.15];
  for (const orbit of ORBITS) {
    const group = new THREE.Group();
    const quat = orbitQuaternion(orbit);
    group.quaternion.copy(quat);
    world.root.add(group);
    const width = orbit.belt ? 1800 : 1400;
    const geo = new THREE.RingGeometry(orbit.r - width, orbit.r + width, 512, 1).rotateX(-Math.PI / 2);
    const corePx = corePxByStyle[orbit.style] ?? 1.3;
    const sheetVar = orbit.belt ? 1600000 : 260000;
    const material = orbitSheetMaterial(orbit.color, { corePx, sheetVar, style: orbit.style });
    material.uniforms.radius.value = orbit.r;
    const sheet = new THREE.Mesh(geo, material);
    sheet.renderOrder = -1;
    group.add(sheet);
    world.orbits.set(orbit.id, { orbit, group, quat, material });
  }
}

function updateOrbitEmphasis() {
  const focus = scene.planetByKey.get(scene.hoveredKey || scene.selectedKey || scene.lockedKey || '');
  for (const [id, entry] of world.orbits) {
    const count = scene.ringCounts[id] || 0;
    const emphasized = focus && focus.orbitId === id;
    const popFactor = count ? 1 : 0.45;
    const mul = focus ? (emphasized ? 1.65 : 0.55) : 1;
    const baseCore = ORBIT_BASE_CORE[id] ?? 0.6;
    const baseSheet = ORBIT_BASE_SHEET[id] ?? 0.05;
    entry.material.uniforms.core.value = baseCore * popFactor * mul;
    entry.material.uniforms.sheet.value = baseSheet * popFactor * mul;
  }
}

/* ------------------------------------------------------------------ belt */

// --- Asteroid belt -------------------------------------------------------
// Lumpy, cratered rock meshes (smooth normals) + a shader layer that adds
// triplanar-free procedural albedo/bump detail, slow per-rock tumbling, a cool
// rim light and dithered fade-out for rocks that drift too close to the camera.

const rockUniforms = {
  uTime: { value: 0 },
  uFadeNear: { value: 12 },
  uFadeFar: { value: 55 }
};

const ROCK_BUMP_GLSL = `
  ${NOISE_GLSL}
  vec3 rockBump(vec3 surfPos, vec3 surfNorm, vec2 dHdxy) {
    vec3 sx = dFdx(surfPos);
    vec3 sy = dFdy(surfPos);
    vec3 r1 = cross(sy, surfNorm);
    vec3 r2 = cross(surfNorm, sx);
    float det = dot(sx, r1);
    vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
    return normalize(abs(det) * surfNorm - grad);
  }
`;

function makeNoise3(seed) {
  const rand = seededRandom(seed);
  const perm = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i += 1) perm[i] = base[i & 255];
  const values = Float32Array.from({ length: 256 }, () => rand());
  const hash = (x, y, z) => values[perm[(perm[(perm[x & 255] + y) & 255] + z) & 255]];
  const fade = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  return (x, y, z) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = fade(x - xi);
    const v = fade(y - yi);
    const w = fade(z - zi);
    return lerp(
      lerp(lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
      lerp(lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v),
      w
    );
  };
}

// Merge coincident vertices so displaced rocks get smooth, seamless normals.
function indexedFromPositions(positions) {
  const map = new Map();
  const unique = [];
  const index = [];
  for (let i = 0; i < positions.length; i += 3) {
    const key = `${positions[i].toFixed(4)},${positions[i + 1].toFixed(4)},${positions[i + 2].toFixed(4)}`;
    let idx = map.get(key);
    if (idx === undefined) {
      idx = unique.length / 3;
      map.set(key, idx);
      unique.push(positions[i], positions[i + 1], positions[i + 2]);
    }
    index.push(idx);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(unique, 3));
  geo.setIndex(index);
  return geo;
}

function makeRockGeometry(seed, detail, opts = {}) {
  const source = new THREE.IcosahedronGeometry(1, detail);
  const geo = indexedFromPositions(source.attributes.position.array);
  source.dispose();
  const noise = makeNoise3(seed);
  const rand = seededRandom(seed ^ 0x5bd1e995);
  const lumpyAmp = opts.lumpy ?? 0.7;
  const medAmp = opts.medium ?? 0.24;
  const fineAmp = opts.fine ?? 0.07;
  const craterScale = opts.craterScale ?? 1;
  const stretchScale = opts.stretchScale ?? 1;
  const craters = Array.from({ length: 5 + Math.floor(rand() * 6) }, () => {
    const v = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    return { dir: v, radius: 0.18 + rand() * 0.32, depth: (0.05 + rand() * 0.09) * craterScale };
  });
  const stretch = new THREE.Vector3(
    1 + (rand() * 0.5 - 0.25) * stretchScale,
    1 + (rand() * 0.4 - 0.35) * stretchScale,
    1 + (rand() * 0.35 - 0.15) * stretchScale
  );
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).normalize();
    let r = 1;
    // large lumpy shape + medium bumps
    r += (noise(v.x * 1.4 + 3, v.y * 1.4 + 7, v.z * 1.4 + 11) - 0.5) * lumpyAmp;
    r += (noise(v.x * 3.2 + 1, v.y * 3.2 + 5, v.z * 3.2 + 9) - 0.5) * medAmp;
    r += (noise(v.x * 7.5, v.y * 7.5, v.z * 7.5) - 0.5) * fineAmp;
    // impact craters: bowl with a slightly raised rim
    for (const crater of craters) {
      const d = v.angleTo(crater.dir) / crater.radius;
      if (d < 1) r -= crater.depth * (1 - d * d);
      else if (d < 1.35) r += crater.depth * 0.35 * Math.sin(((d - 1) / 0.35) * Math.PI);
    }
    v.multiplyScalar(r).multiply(stretch);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function makeRockMaterial() {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.04 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = rockUniforms.uTime;
    shader.uniforms.uFadeNear = rockUniforms.uFadeNear;
    shader.uniforms.uFadeFar = rockUniforms.uFadeFar;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aSpin;
        uniform float uTime;
        varying vec3 vRockPos;
        varying float vViewDist;
        mat3 rockRotation(vec3 axis, float angle) {
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;
          return mat3(
            oc * axis.x * axis.x + c, oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
            oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z + axis.x * s,
            oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c);
        }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        mat3 spinMatrix = rockRotation(normalize(aSpin.xyz), uTime * aSpin.w);
        objectNormal = spinMatrix * objectNormal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vRockPos = position;
        transformed = spinMatrix * transformed;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vViewDist = -mvPosition.z;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uFadeNear;
        uniform float uFadeFar;
        varying vec3 vRockPos;
        varying float vViewDist;
        ${ROCK_BUMP_GLSL}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        float rockFade = smoothstep(uFadeNear, uFadeFar, vViewDist);
        float rockDither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
        if (rockFade < rockDither) discard;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rockDetail = 1.0 - smoothstep(450.0, 4500.0, vViewDist);
        float rockLarge = fbm3(vRockPos * 2.6 + 4.0);
        float rockFine = noise3(vRockPos * 16.0) * rockDetail;
        diffuseColor.rgb *= 0.55 + 0.7 * rockLarge + 0.1 * rockFine;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.18, 1.05, 0.9), smoothstep(0.55, 0.8, rockLarge) * 0.5);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float rockHeight = fbm3(vRockPos * 5.5) * 0.7 + noise3(vRockPos * 20.0) * 0.22 * rockDetail;
        normal = rockBump(-vViewPosition, normal, vec2(dFdx(rockHeight), dFdy(rockHeight)) * (0.5 + 1.1 * rockDetail));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rockRim = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += vec3(0.22, 0.28, 0.42) * rockRim * 0.45 + diffuseColor.rgb * 0.05;`);
  };
  material.customProgramCacheKey = () => 'pulse-rock-v3';
  return material;
}

function makeContributorRockMaterial(seedKey) {
  const h = hashString(seedKey, 0x3c6ef372);
  const seedOffset = new THREE.Vector3(((h & 255) / 255) * 19, (((h >>> 8) & 255) / 255) * 19, (((h >>> 16) & 255) / 255) * 19);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.06,
    emissive: new THREE.Color('#64748b'),
    emissiveIntensity: 0.02
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSeed = { value: seedOffset };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vRockPos;
        varying vec3 vObjNormal;
        varying float vViewDist;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vRockPos = position;
        vObjNormal = normalize(objectNormal);`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vViewDist = -mvPosition.z;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform mat3 normalMatrix;
        uniform vec3 uSeed;
        varying vec3 vRockPos;
        varying vec3 vObjNormal;
        varying float vViewDist;
        ${NOISE_GLSL}
        float rockSample(vec3 p, float detail) {
          return fbm3(p * 4.5 + uSeed) * 0.72 + noise3(p * 14.0 + uSeed) * 0.28 * detail;
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rockDetail = 1.0 - smoothstep(180.0, 1200.0, vViewDist);
        float rockLarge = fbm3(vRockPos * 2.8 + uSeed);
        float rockFine = noise3(vRockPos * 14.0 + uSeed) * rockDetail;
        vec3 rockTint = mix(vec3(0.46, 0.5, 0.58), vec3(0.76, 0.72, 0.68), rockLarge);
        diffuseColor.rgb *= rockTint * (0.64 + 0.56 * rockLarge + 0.14 * rockFine);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 smoothViewNormal = normal;
        float eps = 0.015;
        float h0 = rockSample(vRockPos, rockDetail);
        vec3 gradObj = vec3(
          rockSample(vRockPos + vec3(eps, 0.0, 0.0), rockDetail) - h0,
          rockSample(vRockPos + vec3(0.0, eps, 0.0), rockDetail) - h0,
          rockSample(vRockPos + vec3(0.0, 0.0, eps), rockDetail) - h0
        ) / eps;
        vec3 nObj = normalize(vObjNormal);
        vec3 tangentGradObj = gradObj - nObj * dot(gradObj, nObj);
        float bumpStrength = 0.04 + 0.04 * rockDetail;
        normal = normalize(normalMatrix * (nObj - bumpStrength * tangentGradObj));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rockRim = pow(1.0 - clamp(abs(dot(smoothViewNormal, normalize(vViewPosition))), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += vec3(0.24, 0.32, 0.48) * rockRim * 0.42 + diffuseColor.rgb * 0.05;`);
  };
  material.customProgramCacheKey = () => 'pulse-contributor-rock-v2';
  return material;
}

function buildBelt() {
  const orbit = ORBIT_BY_ID.outer;
  const rand = seededRandom(0xa57e);
  const smallVariants = Array.from({ length: 6 }, (_, i) => makeRockGeometry(0x1000 + i * 977, 2));
  const bigVariants = Array.from({ length: 3 }, (_, i) => makeRockGeometry(0x9000 + i * 1543, 4));
  const material = makeRockMaterial();
  const buckets = new Map();
  const add = (geo, entry) => {
    if (!buckets.has(geo)) buckets.set(geo, []);
    buckets.get(geo).push(entry);
  };

  const count = 4400;
  for (let i = 0; i < count; i += 1) {
    const a = rand() * TAU;
    const gauss = (rand() + rand() + rand() - 1.5) / 1.5;
    const r = orbit.r + gauss * orbit.belt * 1.28;
    const y = (rand() + rand() - 1) * 1600;
    const big = rand() < 0.012;
    const scale = big ? 36 + rand() * 52 : 6.0 + rand() ** 2.5 * 22.0;
    const hue = 0.58 + rand() * 0.12;
    const entry = {
      position: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * TAU, rand() * TAU, rand() * TAU)),
      scale: new THREE.Vector3(scale, scale, scale),
      color: new THREE.Color().setHSL(hue, 0.05 + rand() * 0.1, 0.42 + rand() * 0.22),
      spin: [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1, (0.05 + rand() * 0.35) * (big ? 0.35 : 1)]
    };
    add(big ? bigVariants[i % bigVariants.length] : smallVariants[i % smallVariants.length], entry);
  }

  const spinner = new THREE.Group();
  const matrix = new THREE.Matrix4();
  const meshes = [];
  for (const [geo, entries] of buckets) {
    const mesh = new THREE.InstancedMesh(geo, material, entries.length);
    const spins = new Float32Array(entries.length * 4);
    entries.forEach((entry, i) => {
      matrix.compose(entry.position, entry.quaternion, entry.scale);
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, entry.color);
      spins.set(entry.spin, i * 4);
    });
    geo.setAttribute('aSpin', new THREE.InstancedBufferAttribute(spins, 4));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    spinner.add(mesh);
    meshes.push(mesh);
  }

  const group = new THREE.Group();
  group.quaternion.copy(world.orbits.get('outer').quat);
  group.add(spinner);
  world.root.add(group);
  world.belt = { group, spinner, meshes, material };
}

/* --------------------------------------------------------------- planets */

function planetTexture(planet) {
  const key = `${planet.orbitId}:${planet.key}:${planet.color}:${planet.ringColor}`;
  let texture = textureCache.get(key);
  if (!texture) {
    let canvas;
    if (planet.orbitId === 'tier1') {
      canvas = terrestrialCanvas(planet.color, planet.key, 512, 256);
    } else if (planet.orbitId === 'tier2') {
      canvas = iceGiantCanvas(planet.color, planet.key, 512, 256, { accent: planet.ringColor });
    } else if (planet.starred) {
      canvas = gasGiantCanvas(planet.color, planet.key, 512, 256, { accent: planet.ringColor, rich: planet.orbitId === 'top5' });
    } else {
      canvas = rockyCanvas(planet.key);
    }
    texture = canvasTexture(canvas, { repeat: true });
    textureCache.set(key, texture);
  }
  return texture;
}

function ensurePlanetObject(planet) {
  const sig = `${planet.orbitId}|${planet.starred}|${planet.color}|${planet.ringStyle?.id || ''}|${planet.ringStyle?.opacity || 0}|${planet.moonCount}|${planet.rank || 0}`;
  if (planet.obj && planet.obj.sig === sig) return;
  if (planet.obj) disposePlanetObject(planet, { keepLabel: true });
  if (!world.ok) return;

  const group = new THREE.Group();
  const axialGroup = new THREE.Group();
  const tiltH = hashString(planet.key, 0x91e10da5);
  const obliquityX = planet.ringStyle ? planet.ringStyle.tilt : ((((tiltH % 200) / 200) - 0.5) * 0.44);
  const obliquityZ = ((((tiltH >>> 8) % 200) / 200) - 0.5) * 0.28;
  axialGroup.rotation.set(obliquityX, 0, obliquityZ);
  group.add(axialGroup);

  const isOuter = !planet.starred || planet.orbitId === 'outer';
  let body;
  let material;
  let atmosphere = null;
  let atmosphereBaseIntensity = 0;
  let atmosphereSheen = null;
  let sheenBaseIntensity = 0;
  let glint = null;
  let glintMeta = null;

  const ensureBeaconTexture = () => {
    if (!world.textures.beacon) {
      world.textures.beacon = canvasTexture(radialGlowCanvas([
        [0, 'rgba(224,242,254,1)'],
        [0.2, 'rgba(147,197,253,0.72)'],
        [0.52, 'rgba(125,211,252,0.18)'],
        [1, 'rgba(125,211,252,0)']
      ], 64));
    }
    return world.textures.beacon;
  };

  if (isOuter) {
    const rockGeo = makeRockGeometry(hashString(planet.key, 0x3c6ef372), 4, {
      lumpy: 0.16,
      medium: 0.06,
      fine: 0.02,
      craterScale: 0.45,
      stretchScale: 0.35
    });
    material = makeContributorRockMaterial(planet.key);
    body = new THREE.Mesh(rockGeo, material);
    axialGroup.add(body);

    glint = new THREE.Sprite(new THREE.SpriteMaterial({
      map: ensureBeaconTexture(),
      color: 0xbae6fd,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    glint.scale.setScalar(3.8);
    glintMeta = { near: 600, far: 4200, opacity: 0.62 };
    group.add(glint);
  } else {
    const isIce = planet.orbitId === 'tier2';
    const isTerrestrial = planet.orbitId === 'tier1';
    material = new THREE.MeshStandardMaterial({
      map: planetTexture(planet),
      roughness: isIce ? 0.62 : (isTerrestrial ? 0.76 : 0.78),
      metalness: isTerrestrial ? 0.05 : 0.02,
      emissive: new THREE.Color(planet.color),
      emissiveIntensity: planet.orbitId === 'top5' ? 0.05 : 0.035
    });
    body = new THREE.Mesh(SPHERE_GEO, material);
    axialGroup.add(body);

    atmosphereBaseIntensity = isIce ? 0.72 : (isTerrestrial ? 0.64 : (planet.orbitId === 'top5' ? 0.78 : 0.7));
    const atmoPower = isIce ? 2.4 : (isTerrestrial ? 2.7 : 2.5);
    const atmoScale = isTerrestrial ? 1.055 : 1.075;
    const limbPeak = isTerrestrial ? 0.32 : 0.37;
    atmosphere = new THREE.Mesh(SPHERE_GEO, planetBackAtmosphereMaterial(planet.color, atmosphereBaseIntensity, atmoPower, limbPeak));
    atmosphere.scale.setScalar(atmoScale);
    axialGroup.add(atmosphere);

    sheenBaseIntensity = isIce ? 0.3 : (isTerrestrial ? 0.26 : 0.28);
    atmosphereSheen = new THREE.Mesh(SPHERE_GEO, planetFrontAtmosphereMaterial(planet.color, sheenBaseIntensity, 4.2));
    atmosphereSheen.scale.setScalar(1.006);
    axialGroup.add(atmosphereSheen);

    if (isTerrestrial || isIce) {
      glint = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ensureBeaconTexture(),
        color: new THREE.Color(planet.color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      glint.scale.setScalar(isTerrestrial ? 3.2 : 2.6);
      glintMeta = isTerrestrial
        ? { near: 4000, far: 15000, opacity: 0.48 }
        : { near: 7500, far: 22000, opacity: 0.36 };
      group.add(glint);
    }
  }

  let ringGroup = null;
  const ringMeshes = [];
  let ringDust = null;
  let ringOuter = 1.0;
  if (planet.ringStyle) {
    const style = planet.ringStyle;
    ringGroup = new THREE.Group();
    axialGroup.add(ringGroup);
    ringOuter = style.outer || 1.0;

    let ringTint = new THREE.Color(planet.ringColor);
    if (planet.orbitId === 'top5' && planet.rank && TOP5_PALETTE[planet.rank]) {
      ringTint = ringTint.clone().lerp(new THREE.Color(TOP5_PALETTE[planet.rank].halo), 0.38);
    }

    const bands = Array.isArray(style.bands) ? style.bands : [[1.4, style.outer || 2.1]];
    bands.forEach(([inner, outer], bandIdx) => {
      const geo = new THREE.RingGeometry(inner, outer, 192, 4);
      remapRingUVs(geo, inner, outer);
      geo.rotateX(-Math.PI / 2);
      const tex = canvasTexture(ringCanvas(`${planet.key}:ring:${bandIdx}`, style.id, bandIdx, 1024));
      const mat = planetRingMaterial(tex, ringTint, style.opacity ?? 0.78);
      const mesh = new THREE.Mesh(geo, mat);
      ringGroup.add(mesh);
      ringMeshes.push({ mesh, material: mat, geometry: geo, texture: tex });
    });

    if (style.dust > 0) {
      const dustCount = style.dust;
      const dPos = new Float32Array(dustCount * 3);
      const dSize = new Float32Array(dustCount);
      const drand = seededRandom(hashString(`${planet.key}:ring-dust`, 0x62b3d1));
      for (let i = 0; i < dustCount; i += 1) {
        const band = bands[i % bands.length];
        const r = band[0] + drand() * (band[1] - band[0]);
        const a = drand() * TAU;
        dPos[i * 3] = Math.cos(a) * r;
        dPos[i * 3 + 1] = (drand() - 0.5) * 0.024;
        dPos[i * 3 + 2] = Math.sin(a) * r;
        dSize[i] = 1.2 + drand() * 1.8;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
      dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
      const dustMat = planetRingDustMaterial(ringTint, Math.min(0.86, (style.opacity ?? 0.78) * 0.95));
      ringDust = new THREE.Points(dustGeo, dustMat);
      ringGroup.add(ringDust);
    }
  }

  const moons = [];
  if (planet.moonCount > 0) {
    if (!world.textures.moon) {
      world.textures.moon = canvasTexture(rockyCanvas('moon-surface', 256, 128), { repeat: true });
    }
    const isTerrestrial = planet.orbitId === 'tier1';
    for (let m = 0; m < planet.moonCount; m += 1) {
      const moon = new THREE.Mesh(SPHERE_GEO, new THREE.MeshStandardMaterial({
        map: world.textures.moon,
        roughness: 0.92,
        metalness: 0.04
      }));
      moon.scale.setScalar(isTerrestrial ? 0.12 - m * 0.02 : 0.13 - m * 0.02);
      moon.userData = {
        radius: (ringOuter > 1.0 ? ringOuter + 0.48 + m * 0.48 : 2.0 + m * 0.55),
        speed: (0.85 - m * 0.14) * planet.moonSpeed,
        phase: (m * TAU) / Math.max(1, planet.moonCount),
        tilt: (m % 2 ? 1 : -1) * (0.02 + m * 0.018)
      };
      axialGroup.add(moon);
      moons.push(moon);
    }
  }

  group.visible = false;
  world.root.add(group);
  planet.obj = {
    sig,
    group,
    axialGroup,
    body,
    material,
    atmosphere,
    atmosphereBaseIntensity,
    atmosphereSheen,
    sheenBaseIntensity,
    glint,
    glintMeta,
    ringGroup,
    ringMeshes,
    ringDust,
    ringOuter,
    moons
  };
}

function disposePlanetObject(planet, { keepLabel = false } = {}) {
  const obj = planet.obj;
  if (obj) {
    world.root.remove(obj.group);
    if (obj.body?.geometry && obj.body.geometry !== SPHERE_GEO) obj.body.geometry.dispose();
    obj.material.dispose();
    obj.atmosphere?.material.dispose();
    obj.atmosphereSheen?.material.dispose();
    obj.glint?.material.dispose();
    for (const band of obj.ringMeshes || []) {
      band.geometry.dispose();
      band.texture?.dispose();
      band.material.dispose();
    }
    if (obj.ringDust) {
      obj.ringDust.geometry.dispose();
      obj.ringDust.material.dispose();
    }
    obj.moons.forEach((moon) => moon.material.dispose());
    planet.obj = null;
  }
  if (!keepLabel && planet.labelEl) {
    planet.labelEl.remove();
    planet.labelEl = null;
  }
}

/* ----------------------------------------------------------------- links */

const LINK_SEGMENTS = 36;
const MAX_LINKS = 420;

function buildLinkLayer() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_LINKS * LINK_SEGMENTS * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_LINKS * LINK_SEGMENTS * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setDrawRange(0, 0);
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  lines.frustumCulled = false;
  world.root.add(lines);

  const sparkTex = canvasTexture(radialGlowCanvas([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']], 64));
  world.links = { lines };
  world.textures.spark = sparkTex;
}

const LINK_COLORS = {
  sent: new THREE.Color('#7dd3fc'),
  received: new THREE.Color('#f472b6'),
  pair: new THREE.Color('#fde047')
};
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _p = new THREE.Vector3();
const _q = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _prevColor = new THREE.Color();
const _curColor = new THREE.Color();

function anchorFor(body, toward, out) {
  if (body.isChampion) {
    out.copy(toward).normalize().multiplyScalar(SUN_RADIUS * 1.04);
    return out;
  }
  return out.copy(body.pos);
}

function curvePoint(a, c, b, t, out) {
  const u = 1 - t;
  return out.set(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z
  );
}

function linkControlPoint(a, b, out) {
  const dist = a.distanceTo(b);
  out.addVectors(a, b).multiplyScalar(0.5);
  const outward = _q.copy(out).setY(0).normalize().multiplyScalar(dist * 0.12);
  out.add(outward);
  out.y += Math.min(7200, dist * 0.34) + 420;
  return out;
}

function linkVertexFade(t, phase, activeMotion, isPair, intensity, breath) {
  const arch = 0.24 + 0.58 * Math.sin(t * Math.PI);
  let pulse = activeMotion ? Math.exp(-((t - phase) ** 2) / 0.022) : 0;
  if (isPair && activeMotion) {
    pulse = Math.max(pulse, Math.exp(-((t - (1 - phase)) ** 2) / 0.022) * 0.85);
  }
  return arch * intensity * (breath + pulse * 0.34);
}

function updateLinks() {
  const layer = world.links;
  if (!layer) return;
  const focusKey = scene.selectedKey || scene.lockedKey;
  const list = focusKey ? (scene.linksByKey.get(focusKey) || []) : (scene.constellation ? scene.links : []);
  const pos = layer.lines.geometry.attributes.position;
  const col = layer.lines.geometry.attributes.color;
  const strong = Boolean(focusKey);
  const activeMotion = !state.motionPaused && !prefersReducedMotion();
  const intensity = strong ? 0.86 : 0.30;
  const speed = strong ? 0.22 : 0.12;
  let v = 0;

  for (const link of list.slice(0, MAX_LINKS)) {
    const A = scene.planetByKey.get(link.fromKey);
    const B = scene.planetByKey.get(link.toKey);
    if (!A || !B || (!A.isChampion && !A.visible) || (!B.isChampion && !B.visible)) continue;
    if (!strong && scene.matchKeys && !(scene.matchKeys.has(A.key) || scene.matchKeys.has(B.key))) continue;
    anchorFor(A, B.pos, _a);
    anchorFor(B, A.pos, _b);
    linkControlPoint(_a, _b, _c);
    const isPair = link.type === 'pair';
    const base = isPair ? LINK_COLORS.pair : (focusKey && link.toKey === focusKey ? LINK_COLORS.received : LINK_COLORS.sent);
    const phase = ((scene.time * speed + link.seed) % 1) * 1.4 - 0.2;
    const breath = activeMotion ? 0.92 + 0.08 * Math.sin(scene.time * 1.4 + link.seed * TAU) : 1;

    curvePoint(_a, _c, _b, 0, _prev);
    _prevColor.copy(base).multiplyScalar(linkVertexFade(0, phase, activeMotion, isPair, intensity, breath));

    for (let i = 1; i <= LINK_SEGMENTS; i += 1) {
      const t = i / LINK_SEGMENTS;
      const cur = curvePoint(_a, _c, _b, t, _p);
      _curColor.copy(base).multiplyScalar(linkVertexFade(t, phase, activeMotion, isPair, intensity, breath));
      pos.setXYZ(v, _prev.x, _prev.y, _prev.z);
      col.setXYZ(v, _prevColor.r, _prevColor.g, _prevColor.b);
      pos.setXYZ(v + 1, cur.x, cur.y, cur.z);
      col.setXYZ(v + 1, _curColor.r, _curColor.g, _curColor.b);
      v += 2;
      _prev.copy(cur);
      _prevColor.copy(_curColor);
    }
  }
  layer.lines.geometry.setDrawRange(0, v);
  pos.needsUpdate = true;
  col.needsUpdate = true;
}

/* --------------------------------------------------------------- effects */

function addEffect(effect) {
  scene.effects.push({ t0: scene.time, ...effect });
}

function bodyPosition(key) {
  const body = scene.planetByKey.get(key);
  return body ? body.pos : null;
}

function effectColor(rgbString) {
  const [r, g, b] = String(rgbString || '255, 209, 102').split(',').map((n) => Number(n) / 255);
  return new THREE.Color(r, g, b);
}

function disposeEffect(fx) {
  if (fx.obj) {
    world.root.remove(fx.obj);
    fx.obj.traverse?.((child) => {
      if (child.geometry && child.geometry !== SHOCK_GEO) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

function updateEffects() {
  if (!scene.effects.length || !world.ok) return;
  const keep = [];
  for (const fx of scene.effects) {
    const k = (scene.time - fx.t0) / fx.dur;
    if (k >= 1) {
      disposeEffect(fx);
      fx.onDone?.();
      continue;
    }
    keep.push(fx);
    if (k < 0) continue;

    if (fx.type === 'shock' || fx.type === 'sunpulse') {
      if (!fx.obj) {
        fx.obj = new THREE.Mesh(SHOCK_GEO, new THREE.MeshBasicMaterial({
          color: effectColor(fx.type === 'sunpulse' ? '255, 196, 110' : fx.color),
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }));
        world.root.add(fx.obj);
      }
      const e = easeOutCubic(k);
      if (fx.type === 'sunpulse') {
        fx.obj.position.set(0, 0, 0);
        fx.obj.quaternion.copy(world.orbits.get(fx.orbitId || 'top5')?.quat || new THREE.Quaternion());
        fx.obj.scale.setScalar(SUN_RADIUS + e * 26000);
        fx.obj.material.opacity = 0.65 * (1 - k);
      } else {
        const body = scene.planetByKey.get(fx.key);
        if (!body) continue;
        fx.obj.position.copy(body.pos);
        const orbitQuat = world.orbits.get(body.orbitId)?.quat;
        if (orbitQuat) fx.obj.quaternion.copy(orbitQuat);
        const base = body.isChampion ? SUN_RADIUS : body.size;
        fx.obj.scale.setScalar(base * 1.2 + e * (fx.maxR || 70) * (body.isChampion ? 4 : 1.8));
        fx.obj.material.opacity = 0.95 * (1 - k);
      }
    } else if (fx.type === 'comet' || fx.type === 'meteor') {
      const to = bodyPosition(fx.toKey);
      if (!to) continue;
      if (!fx.obj) {
        const group = new THREE.Group();
        const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: world.textures.spark, color: effectColor(fx.color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        head.scale.setScalar(fx.type === 'meteor' ? 780 : 520);
        group.add(head);
        const n = 40;
        const tGeo = new THREE.BufferGeometry();
        tGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        const tCol = new Float32Array(n * 3);
        const c = effectColor(fx.color);
        for (let i = 0; i < n; i += 1) {
          const f = (i / (n - 1)) ** 1.5;
          tCol.set([c.r * f, c.g * f, c.b * f], i * 3);
        }
        tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
        const tail = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        tail.frustumCulled = false;
        group.add(tail);
        fx.obj = group;
        fx.head = head;
        fx.tail = tail;
        world.root.add(group);
      }
      const from = fx.type === 'comet' ? bodyPosition(fx.fromKey) : _q.set(fx.from.x, fx.from.y, fx.from.z);
      if (!from) continue;
      _a.copy(from);
      _b.copy(to);
      if (fx.type === 'comet') linkControlPoint(_a, _b, _c);
      else _c.addVectors(_a, _b).multiplyScalar(0.5);
      const e = fx.type === 'comet' ? easeOutCubic(k) : k * k;
      curvePoint(_a, _c, _b, e, _p);
      fx.head.position.copy(_p);
      const tp = fx.tail.geometry.attributes.position;
      for (let i = 0; i < tp.count; i += 1) {
        const t = Math.max(0, e - (1 - i / (tp.count - 1)) * 0.22);
        curvePoint(_a, _c, _b, t, _p);
        tp.setXYZ(i, _p.x, _p.y, _p.z);
      }
      tp.needsUpdate = true;
    }
  }
  scene.effects = keep;
}

/* ------------------------------------------------------------ frame loop */

const _tmp = new THREE.Vector3();
const _tmp2 = new THREE.Vector3();

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function updateSun(dt) {
  const sun = world.sun;
  if (!sun) return;
  const u = sun.material.uniforms;
  u.time.value = scene.time;
  u.avatarMix.value += ((sun.targetAvatarMix || 0) - u.avatarMix.value) * Math.min(1, dt * 1.5);
  sun.heatPulse = Math.max(0, sun.heatPulse - dt * 0.6);
  u.heat.value = 1 + sun.heatPulse * 0.8 + 0.04 * Math.sin(scene.time * 1.3);
  sun.corona.material.rotation += dt * 0.012;
  sun.corona2.material.rotation -= dt * 0.008;
  const breathe = 1 + 0.03 * Math.sin(scene.time * 0.8);
  sun.glow.scale.setScalar(SUN_RADIUS * 4.0 * breathe * (1 + sun.heatPulse * 0.4));
  sun.throneRing.material.opacity += ((sun.targetRing || 0) - sun.throneRing.material.opacity) * Math.min(1, dt * 1.2);
  sun.particles.material.opacity += ((sun.targetParticles ?? 0.3) - sun.particles.material.opacity) * Math.min(1, dt * 1.2);
  if (!state.motionPaused) sun.disk.rotation.y += dt * 0.05 * (prefersReducedMotion() ? 0.3 : 1);
  sun.mesh.rotation.y += dt * 0.01;
}

function updatePlanets(dt) {
  const speed = state.motionPaused ? 0 : (prefersReducedMotion() ? 0.3 : 1);
  for (const orbit of ORBITS) scene.ringPhase[orbit.id] += omegaForRadius(orbit.r) * dt * speed;
  if (world.belt) world.belt.spinner.rotation.y = -scene.ringPhase.outer * 0.92;
  if (!state.motionPaused) rockUniforms.uTime.value += dt * (prefersReducedMotion() ? 0.3 : 1);
  const kAngle = 1 - Math.exp(-dt * 1.8);
  const kRadius = 1 - Math.exp(-dt * 1.1);
  const kSize = 1 - Math.exp(-dt * 2.4);
  const activeKey = scene.selectedKey || scene.lockedKey;
  const selectedLinks = activeKey ? linkedKeysOf(activeKey) : null;

  for (const planet of scene.planets) {
    const obj = planet.obj;
    if (scene.time - planet.born < planet.introDelay) {
      planet.visible = false;
      if (obj) obj.group.visible = false;
      continue;
    }
    planet.visible = !planet.hidden;
    const orbit = ORBIT_BY_ID[planet.orbitId];
    planet.angle += omegaForRadius(orbit.r) * dt * speed;
    planet.angle += wrapPi(scene.ringPhase[planet.orbitId] + planet.slot - planet.angle) * kAngle;
    planet.r += (planet.targetR - planet.r) * kRadius;
    planet.y += (planet.targetY - planet.y) * kAngle;
    planet.size += (planet.targetSize - planet.size) * kSize;
    planet.alpha = Math.min(1, planet.alpha + dt * 0.8);

    if (planet.transition < 1) {
      planet.transition = Math.min(1, planet.transition + dt * 0.45);
      const t = easeInOutCubic(planet.transition);
      orbitPosition(planet.prevOrbitId, planet.angle, planet.r, planet.y, _tmp);
      orbitPosition(planet.orbitId, planet.angle, planet.r, planet.y, _tmp2);
      planet.pos.lerpVectors(_tmp, _tmp2, t);
      planet.pos.y += Math.sin(t * Math.PI) * 2500;
    } else {
      orbitPosition(planet.orbitId, planet.angle, planet.r, planet.y, planet.pos);
    }

    let dim = 1;
    if (scene.matchKeys && !scene.matchKeys.has(planet.key)) dim = 0.22;
    else if (activeKey && activeKey !== planet.key && !selectedLinks?.has(planet.key)) dim = 0.4;
    planet.dim += (dim - planet.dim) * kSize;

    if (!obj) continue;
    const renderRadius = Math.max(0.01, planet.size * easeOutCubic(planet.alpha));
    obj.group.visible = planet.visible;
    obj.group.position.copy(planet.pos);
    obj.group.scale.setScalar(renderRadius);
    if (speed) obj.body.rotation.y += dt * 0.18;
    obj.material.color.setScalar(planet.dim);
    const hoverBoost = scene.hoveredKey === planet.key ? 1.45 : 1;
    if (obj.atmosphere) {
      obj.atmosphere.material.uniforms.intensity.value = (obj.atmosphereBaseIntensity || 0.7) * planet.dim * hoverBoost;
    }
    if (obj.atmosphereSheen) {
      obj.atmosphereSheen.material.uniforms.intensity.value = (obj.sheenBaseIntensity || 0.28) * planet.dim * hoverBoost;
    }
    if (obj.glint && obj.glintMeta) {
      const camDist = world.camera ? world.camera.position.distanceTo(planet.pos) : obj.glintMeta.far;
      const farAlpha = smoothstep01(obj.glintMeta.near, obj.glintMeta.far, camDist);
      obj.glint.visible = farAlpha > 0.005 && planet.dim > 0.1;
      obj.glint.material.opacity = farAlpha * obj.glintMeta.opacity * planet.dim * (scene.hoveredKey === planet.key ? 1.5 : 1);
    }
    if (obj.ringGroup && speed) {
      obj.ringGroup.rotation.y += dt * 0.04;
    }
    for (const band of obj.ringMeshes || []) {
      const ru = band.material.uniforms;
      ru.uPlanetPos.value.copy(planet.pos);
      ru.uPlanetRadius.value = renderRadius;
      ru.uDim.value = planet.dim;
      ru.uTime.value = scene.time;
    }
    if (obj.ringDust) {
      const du = obj.ringDust.material.uniforms;
      du.uPlanetPos.value.copy(planet.pos);
      du.uPlanetRadius.value = renderRadius;
      du.uDim.value = planet.dim;
    }
    obj.moons.forEach((moon) => {
      const d = moon.userData;
      const a = scene.time * d.speed + d.phase;
      moon.position.set(Math.cos(a) * d.radius, Math.sin(a) * d.radius * Math.sin(d.tilt), Math.sin(a) * d.radius * Math.cos(d.tilt));
    });
  }
}

function tweenCamera(position, target, duration = 2.2, onDone = null, { logZoom = false } = {}) {
  if (!world.ok) return;
  nav.tween = {
    fromPos: world.camera.position.clone(),
    fromTarget: world.controls.target.clone(),
    toPos: position.clone(),
    toTarget: target.clone(),
    t: 0,
    duration: prefersReducedMotion() ? Math.min(duration, 0.6) : duration,
    logZoom,
    onDone
  };
}

const _origin = new THREE.Vector3(0, 0, 0);
const _panX = new THREE.Vector3();
const _panY = new THREE.Vector3();
const _tweenFromOff = new THREE.Vector3();
const _tweenToOff = new THREE.Vector3();

function updateCamera(dt) {
  const { camera, controls } = world;
  const follow = nav.followKey ? scene.planetByKey.get(nav.followKey) : null;

  if (nav.tween) {
    const tw = nav.tween;
    tw.t = Math.min(1, tw.t + dt / tw.duration);
    const e = easeInOutCubic(tw.t);
    if (follow && !follow.isChampion) {
      // Keep both tween endpoints anchored to the orbiting planet
      const delta = _tmp.copy(follow.pos).sub(nav.lastFollowPos || follow.pos);
      tw.fromPos.add(delta);
      tw.fromTarget.add(delta);
      tw.toPos.add(delta);
      tw.toTarget.add(delta);
      nav.lastFollowPos = follow.pos.clone();
    }
    if (tw.logZoom && (!follow || follow.isChampion)) {
      controls.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
      _tweenFromOff.copy(tw.fromPos).sub(tw.fromTarget);
      _tweenToOff.copy(tw.toPos).sub(tw.toTarget);
      const fromR = Math.max(1, _tweenFromOff.length());
      const toR = Math.max(1, _tweenToOff.length());
      const r = fromR * (toR / fromR) ** e;
      _tweenFromOff.divideScalar(fromR).lerp(_tweenToOff.divideScalar(toR), e).normalize();
      camera.position.copy(controls.target).addScaledVector(_tweenFromOff, r);
    } else {
      camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
      controls.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
    }
    if (tw.t >= 1) {
      nav.tween = null;
      tw.onDone?.();
    }
  } else if (follow && !follow.isChampion && nav.lastFollowPos) {
    const delta = _tmp.copy(follow.pos).sub(nav.lastFollowPos);
    camera.position.add(delta);
    controls.target.add(delta);
    nav.lastFollowPos.copy(follow.pos);
  }

  if (follow && !follow.isChampion && !nav.tween && nav.followReleaseDist > 0) {
    const followDist = camera.position.distanceTo(controls.target);
    if (!nav.followArrived && followDist < nav.followReleaseDist * 0.9) {
      nav.followArrived = true;
    }
    if (nav.followArrived && followDist > nav.followReleaseDist) {
      stopFollowing({ recenter: true });
    }
  }

  if (nav.recentering && !nav.tween && !nav.followKey) {
    const k = 1 - Math.exp(-dt * 4.5);
    controls.target.lerp(_origin, k);
    if (controls.target.lengthSq() < 64) {
      controls.target.set(0, 0, 0);
      nav.recentering = false;
    }
  }

  const wantShift = document.body.classList.contains('has-card') && window.innerWidth > 900 ? Math.min(220, window.innerWidth * 0.12) : 0;
  nav.viewShift = (nav.viewShift || 0) + (wantShift - (nav.viewShift || 0)) * Math.min(1, dt * 4);
  if (Math.abs(nav.viewShift) > 0.5) {
    camera.setViewOffset(window.innerWidth, window.innerHeight, nav.viewShift, 0, window.innerWidth, window.innerHeight);
  } else if (camera.view?.enabled) {
    camera.clearViewOffset();
  }

  const idle = scene.time - scene.lastInteractionAt;
  controls.autoRotate = !nav.tween && !nav.followKey && idle > 16 && !state.motionPaused && !prefersReducedMotion();
  controls.update();

  const distToTarget = camera.position.distanceTo(controls.target);
  const desiredNear = clamp(distToTarget * 0.015, 0.6, 95);
  if (Math.abs(desiredNear - camera.near) / camera.near > 0.08) {
    camera.near = desiredNear;
    camera.updateProjectionMatrix();
  }
}

function renderFrame() {
  const dt = Math.min(world.clock.getDelta(), 0.05);
  scene.time += dt;
  if (world.ok) {
    updateSun(dt);
    updatePlanets(dt);
    updateCamera(dt);
    updateLinks();
    updateEffects();
    const bg = world.background;
    bg.abyss.update(dt, scene.time, world.camera, state.motionPaused || prefersReducedMotion());
    if (!state.motionPaused) bg.dust.rotation.y += dt * 0.004;
    world.composer.render();
    updateLabels();
    positionTooltip();
  }
  window.requestAnimationFrame(renderFrame);
}

/* ---------------------------------------------------------------- labels */

const _proj = new THREE.Vector3();

function screenOf(position, radius) {
  const camera = world.camera;
  _proj.copy(position).project(camera);
  const behind = _proj.z > 1 || _proj.z < -1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dist = camera.position.distanceTo(position);
  const rpx = (radius / Math.max(1, dist)) / Math.tan((camera.fov * Math.PI) / 360) * (h / 2);
  return { x: (_proj.x * 0.5 + 0.5) * w, y: (-_proj.y * 0.5 + 0.5) * h, r: rpx, dist, behind };
}

function labelMarkup(body) {
  const halo = body.rank ? (TOP5_PALETTE[body.rank]?.halo || '#ffd166') : body.color;
  const showAvatar = body.rank || body.freshTag;
  return `
    ${showAvatar ? `<img class="avatar-image" src="${htmlEscape(avatarForProfile(body.profile, 64))}" alt="" width="20" height="20" decoding="async" data-fallback-src="${AVATAR_WARNING_FALLBACK}" />` : ''}
    ${body.rank ? `<b style="color:${htmlEscape(halo)}">${body.rank}</b>` : (body.freshTag ? '<b class="fresh">✦</b>' : '')}
    <span>${htmlEscape(displayName(body.profile))}</span>
    ${body.starred ? `<em style="color:${htmlEscape(body.color)}">${body.score.points}</em>` : ''}
  `;
}

function ensureLabel(body) {
  const layer = elements.labelLayer;
  if (!layer) return null;
  if (!body.labelEl) {
    body.labelEl = document.createElement('div');
    layer.append(body.labelEl);
  }
  const sig = `${displayName(body.profile)}|${body.rank}|${body.score.points}|${body.freshTag}|${body.color}|${body.isChampion}`;
  if (body.labelSig !== sig) {
    body.labelSig = sig;
    body.labelW = 0;
    if (body.isChampion) {
      body.labelEl.className = 'champion-label';
      const tierSuffix = body.score.tierShort ? ` · ${htmlEscape(body.score.tierShort)}` : '';
      body.labelEl.innerHTML = `
        <span class="champion-kicker">#1 · 恒星王座</span>
        <span class="champion-name">${htmlEscape(displayName(body.profile))}</span>
        <span class="champion-meta">@${htmlEscape(body.profile.github || body.key)} · ${body.score.points} 分${tierSuffix}</span>`;
    } else {
      body.labelEl.className = `planet-label${body.rank ? ' is-top' : ''}`;
      body.labelEl.innerHTML = labelMarkup(body);
    }
  }
  return body.labelEl;
}

let emptyThroneEl = null;
let hudRectCache = { at: -1, rects: [] };

function hudRects() {
  if (scene.time - hudRectCache.at > 0.5) {
    const selectors = ['.masthead', '.podium', '.toolbar', '.dock', '.ticker', '.planet-card-host:not([hidden])'];
    hudRectCache = {
      at: scene.time,
      rects: selectors
        .map((sel) => document.querySelector(sel))
        .filter((el) => el && el.offsetParent !== null && getComputedStyle(el).opacity !== '0')
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.left - 8, y: r.top - 8, w: r.width + 16, h: r.height + 16 };
        })
    };
  }
  return hudRectCache.rects.slice();
}
const orbitLabelEls = new Map();

function updateLabels() {
  const layer = elements.labelLayer;
  if (!layer) return;
  const camDist = world.camera.position.length();
  const labelFade = clamp((320000 - camDist) / 100000, 0, 1);
  layer.style.opacity = labelFade < 0.999 ? labelFade.toFixed(3) : '';
  const sunScreen = screenOf(_tmp.set(0, 0, 0), SUN_RADIUS);
  const placed = hudRects();
  const activeKey = scene.selectedKey || scene.lockedKey;
  const selectedLinks = activeKey ? linkedKeysOf(activeKey) : null;
  const focusBody = nav.followKey ? scene.planetByKey.get(nav.followKey) : null;
  const focusScreen = focusBody && !focusBody.isChampion && focusBody.visible && focusBody.obj
    ? screenOf(focusBody.pos, focusBody.size * 1.12)
    : null;
  const zoomIsolate = Boolean(focusScreen && !focusScreen.behind && focusScreen.r > 55);
  if (focusScreen && !focusScreen.behind) {
    placed.push({
      x: focusScreen.x - focusScreen.r,
      y: focusScreen.y - focusScreen.r,
      w: focusScreen.r * 2,
      h: focusScreen.r * 2
    });
  }
  const candidates = [];

  for (const planet of scene.planets) {
    if (!planet.visible || !planet.obj || planet.alpha < 0.6) {
      if (planet.labelEl) planet.labelEl.classList.remove('is-visible');
      continue;
    }
    const sp = screenOf(planet.pos, planet.size);
    planet.screen = sp;
    const occluded = sp.dist > sunScreen.dist && Math.hypot(sp.x - sunScreen.x, sp.y - sunScreen.y) < sunScreen.r * 0.98;
    const focusOccluded = Boolean(
      focusBody &&
      planet.key !== focusBody.key &&
      focusScreen &&
      !focusScreen.behind &&
      sp.dist > focusScreen.dist &&
      Math.hypot(sp.x - focusScreen.x, sp.y - focusScreen.y) < focusScreen.r * 1.15
    );
    const suppressedByZoom = zoomIsolate && planet.key !== focusBody.key && scene.hoveredKey !== planet.key && !selectedLinks?.has(planet.key);
    let priority = 0;
    if (activeKey === planet.key) priority = 100;
    else if (scene.hoveredKey === planet.key) priority = 95;
    else if (planet.rank) priority = 80 - planet.rank;
    else if (selectedLinks?.has(planet.key)) priority = 70;
    else if (scene.matchKeys?.has(planet.key) && scene.matchKeys.size <= 14) priority = 66;
    else if (planet.freshTag) priority = 60;
    else if (sp.r > 9 && planet.dim > 0.5) priority = 10 + Math.min(40, sp.r);
    if (sp.behind || occluded || focusOccluded || suppressedByZoom || sp.x < -50 || sp.x > window.innerWidth + 50 || sp.y < -50 || sp.y > window.innerHeight + 50) priority = 0;
    if (!priority) {
      if (planet.labelEl) planet.labelEl.classList.remove('is-visible');
      continue;
    }
    candidates.push({ planet, sp, priority });
  }

  // Champion headline above the sun
  if (scene.champion && !sunScreen.behind) {
    const el = ensureLabel(scene.champion);
    if (emptyThroneEl) emptyThroneEl.classList.remove('is-visible');
    const y = sunScreen.y - sunScreen.r * 1.15;
    el.style.transform = `translate3d(${sunScreen.x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    const champRect = { x: sunScreen.x - 150, y: y - 86, w: 300, h: 86 };
    const champBlocked = placed.some((o) => champRect.x < o.x + o.w && champRect.x + champRect.w > o.x && champRect.y < o.y + o.h && champRect.y + champRect.h > o.y);
    el.classList.toggle('is-visible', sunScreen.r > 18 && !champBlocked);
    placed.push(champRect);
  } else {
    if (scene.champion?.labelEl) scene.champion.labelEl.classList.remove('is-visible');
    if (!emptyThroneEl) {
      emptyThroneEl = document.createElement('div');
      emptyThroneEl.className = 'champion-label is-empty';
      emptyThroneEl.innerHTML = '<span class="champion-kicker">#1 · 恒星王座</span><span class="champion-name">虚位以待</span><span class="champion-meta">点亮 Star、送出寄语，成为照亮星系的那颗恒星</span>';
      layer.append(emptyThroneEl);
    }
    const y = sunScreen.y - sunScreen.r * 1.15;
    emptyThroneEl.style.transform = `translate3d(${sunScreen.x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    emptyThroneEl.classList.toggle('is-visible', !sunScreen.behind && sunScreen.r > 18 && scene.bootstrapped);
  }
  placed.push({ x: sunScreen.x - sunScreen.r, y: sunScreen.y - sunScreen.r, w: sunScreen.r * 2, h: sunScreen.r * 2 });

  candidates.sort((a, b) => b.priority - a.priority);
  let shown = 0;
  for (const { planet, sp, priority } of candidates) {
    const el = ensureLabel(planet);
    if (!planet.labelW) planet.labelW = el.offsetWidth || 90;
    const w = planet.labelW;
    const h = 24;
    const x = sp.x - w / 2;
    const y = sp.y + Math.max(sp.r * (planet.ringStyle ? 1.6 : 1.15), 6) + 4;
    const rect = { x, y, w, h };
    const overlaps = placed.some((o) => rect.x < o.x + o.w && rect.x + rect.w > o.x && rect.y < o.y + o.h && rect.y + rect.h > o.y);
    if ((overlaps && priority < 90) || shown > 46) {
      el.classList.remove('is-visible');
      continue;
    }
    placed.push(rect);
    shown += 1;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.classList.add('is-visible');
    el.classList.toggle('is-strong', priority >= 90);
    el.classList.toggle('is-dim', planet.dim < 0.6 && priority < 90);
  }

  updateOrbitLabels(placed);
}

function updateOrbitLabels(placed) {
  const layer = elements.labelLayer;
  const compact = window.innerWidth < 760;
  for (const orbit of ORBITS) {
    let el = orbitLabelEls.get(orbit.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'orbit-label';
      el.style.setProperty('--orbit-color', orbit.color);
      layer.append(el);
      orbitLabelEls.set(orbit.id, el);
    }
    const count = scene.ringCounts[orbit.id] || 0;
    const text = `${orbit.label}<small>${orbit.hint}${count ? ` · ${count}` : ''}</small>`;
    if (el.dataset.text !== text) {
      el.dataset.text = text;
      el.innerHTML = text;
    }
    if (compact || !scene.bootstrapped) {
      el.classList.remove('is-visible');
      continue;
    }
    // Collect multiple viewport-safe points along the inclined orbit so labels don't drop on steep inclinations
    const samplePts = [];
    for (let i = 0; i < 48; i += 1) {
      orbitPosition(orbit.id, (i / 48) * TAU, orbit.r + (orbit.belt ? orbit.belt * 0.9 : 0), 0, _tmp);
      const sp = screenOf(_tmp, 1);
      if (sp.behind || sp.y < 90 || sp.y > window.innerHeight - 120 || sp.x < 40 || sp.x > window.innerWidth - 180) continue;
      samplePts.push(sp);
    }
    if (!samplePts.length) {
      el.classList.remove('is-visible');
      continue;
    }
    const pickExtreme = (scoreFn) => samplePts.reduce((acc, p) => (scoreFn(p) > scoreFn(acc) ? p : acc), samplePts[0]);
    const anchors = [
      pickExtreme((p) => p.x),
      pickExtreme((p) => p.x - p.y * 0.75),
      pickExtreme((p) => p.x + p.y * 0.75),
      pickExtreme((p) => -p.x)
    ];
    let chosenRect = null;
    for (const anchor of anchors) {
      const rect = { x: anchor.x + 8, y: anchor.y - 10, w: 130, h: 30 };
      const overlaps = placed.some((o) => rect.x < o.x + o.w && rect.x + rect.w > o.x && rect.y < o.y + o.h && rect.y + rect.h > o.y);
      if (!overlaps) {
        chosenRect = rect;
        break;
      }
    }
    el.classList.toggle('is-visible', Boolean(chosenRect));
    el.classList.toggle('is-empty', !count);
    if (chosenRect) {
      placed.push(chosenRect);
      el.style.transform = `translate3d(${chosenRect.x.toFixed(1)}px, ${chosenRect.y.toFixed(1)}px, 0)`;
    }
  }
}

/* --------------------------------------------------------------- picking */

function pickAt(x, y) {
  if (!world.ok) return null;
  let best = null;
  let bestScore = Infinity;
  let bestDepth = Infinity;
  for (const planet of scene.planets) {
    if (!planet.visible || !planet.obj || planet.dim < 0.3) continue;
    const sp = screenOf(planet.pos, planet.size * 1.1);
    if (sp.behind) continue;
    const minHit = planet.starred ? 20 : 22;
    const hitR = Math.max(sp.r + 10, minHit);
    const d = Math.hypot(x - sp.x, y - sp.y);
    if (d > hitR) continue;
    const direct = d <= Math.max(sp.r + 2, 4);
    const score = (direct ? 0 : 1000) + (d / hitR) * 100 + sp.dist * 0.0003;
    if (score < bestScore) {
      best = { planet };
      bestScore = score;
      bestDepth = sp.dist;
    }
  }
  const sun = screenOf(_tmp.set(0, 0, 0), SUN_RADIUS);
  if (!sun.behind && Math.hypot(x - sun.x, y - sun.y) <= sun.r && sun.dist - SUN_RADIUS < bestDepth) {
    return { sun: true };
  }
  return best;
}

/* ============================================================ interaction */

function markInteraction() {
  scene.lastInteractionAt = scene.time;
}

function applyPreset(name, duration = 2.6) {
  const preset = CAMERA_PRESETS[name] || CAMERA_PRESETS.awe;
  nav.preset = name in CAMERA_PRESETS ? name : 'awe';
  stopFollowing({ recenter: false });
  tweenCamera(new THREE.Vector3(...preset.position), new THREE.Vector3(...preset.target), duration);
  if (elements.btnZoomReset) elements.btnZoomReset.textContent = `视角 · ${preset.label}`;
  updateOrbitEmphasis();
  markInteraction();
}

function cyclePreset() {
  const idx = PRESET_ORDER.indexOf(nav.preset);
  const next = PRESET_ORDER[(idx + 1) % PRESET_ORDER.length];
  applyPreset(next);
  const lockedBody = scene.lockedKey ? scene.planetByKey.get(scene.lockedKey) : null;
  if (lockedBody) {
    toast(`视角 · ${CAMERA_PRESETS[next].label}（持续锁定「${displayName(lockedBody.profile)}」）`, 2000);
  }
}

function resetView() {
  applyPreset(nav.preset);
}

function dollyBy(factor) {
  if (!world.ok) return;
  const { camera, controls } = world;
  const offset = _tmp.copy(camera.position).sub(controls.target).multiplyScalar(factor);
  const len = clamp(offset.length(), controls.minDistance, controls.maxDistance);
  offset.setLength(len);
  tweenCamera(controls.target.clone().add(offset), controls.target.clone(), 0.6);
  markInteraction();
}

function orbitCameraBy(dTheta, dPhi) {
  if (!world.ok) return;
  const { camera, controls } = world;
  const offset = _tmp.copy(camera.position).sub(controls.target);
  const sph = new THREE.Spherical().setFromVector3(offset);
  sph.theta += dTheta;
  sph.phi = clamp(sph.phi + dPhi, 0.05, Math.PI - 0.05);
  offset.setFromSpherical(sph);
  tweenCamera(controls.target.clone().add(offset), controls.target.clone(), 0.45);
  markInteraction();
}

function lockPlanet(key) {
  if (!key) return;
  if (scene.lockedKey !== key) {
    scene.lockedKey = key;
    scene.lockedAt = performance.now();
  }
  updateOrbitEmphasis();
}

function followPlanet(key) {
  const body = scene.planetByKey.get(key);
  if (!body || !world.ok) return;
  lockPlanet(key);
  nav.followKey = key;
  nav.recentering = false;
  nav.followArrived = false;
  nav.followReleaseDist = 0;
  if (body.isChampion) {
    const dir = _tmp2.set(world.camera.position.x, 0, world.camera.position.z);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();
    world.controls.minDistance = Math.max(24, SUN_RADIUS * 1.65);
    tweenCamera(
      dir.multiplyScalar(SUN_RADIUS * 3.8).add(new THREE.Vector3(0, SUN_RADIUS * 0.45, 0)),
      new THREE.Vector3(0, 0, 0),
      2.2,
      () => { if (nav.followKey === key) nav.followArrived = true; }
    );
    markInteraction();
    updateOrbitEmphasis();
    return;
  }
  const r = Math.max(body.targetSize || body.size || 18, 12);
  const ringOuter = body.obj?.ringOuter || (body.ringStyle ? body.ringStyle.outer : 1.0);
  const dist = body.starred ? r * Math.max(4.8, ringOuter * 2.35) : r * 4.8;
  world.controls.minDistance = Math.max(24, r * 2.1);

  const outward = body.pos.clone();
  if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1);
  else outward.normalize();
  const tangent = new THREE.Vector3(0, 1, 0).cross(outward);
  if (tangent.lengthSq() < 1e-6) tangent.set(1, 0, 0);
  else tangent.normalize();
  const camUp = outward.clone().cross(tangent).normalize();
  const offset = outward.multiplyScalar(dist * 0.96)
    .add(tangent.multiplyScalar(dist * 0.13))
    .add(camUp.multiplyScalar(dist * 0.15));

  nav.lastFollowPos = body.pos.clone();
  tweenCamera(
    body.pos.clone().add(offset),
    body.pos.clone(),
    2.1,
    () => { if (nav.followKey === key) nav.followArrived = true; }
  );
  markInteraction();
  updateOrbitEmphasis();
}

function stopFollowing({ recenter = false } = {}) {
  nav.followKey = null;
  nav.lastFollowPos = null;
  nav.followReleaseDist = 0;
  nav.followArrived = false;
  nav.recentering = Boolean(recenter);
  if (world.controls) world.controls.minDistance = 24;
}

function unlockPlanet({ recenter = true, notify = true } = {}) {
  clearPendingClick();
  const prevKey = scene.lockedKey || nav.followKey;
  const prevBody = prevKey ? scene.planetByKey.get(prevKey) : null;
  scene.lockedKey = null;
  scene.lockedAt = 0;
  const wasFollowing = Boolean(nav.followKey);
  if (wasFollowing) stopFollowing({ recenter: Boolean(recenter && !prevBody?.isChampion) });
  if (scene.selectedKey) {
    closePlanetCard({ keepFollow: false, keepLock: false });
  } else {
    updateOrbitEmphasis();
  }
  if (notify && prevBody) {
    toast(`已取消锁定「${displayName(prevBody.profile)}」`, 2000);
  }
}

function selectPlanet(planet, { follow = false } = {}) {
  if (!planet) return;
  clearPendingClick();
  lockPlanet(planet.key);
  scene.selectedKey = planet.key;
  scene.overviewOpen = false;
  if (follow) followPlanet(planet.key);
  renderPlanetCard(planet);
  updateOrbitEmphasis();
  hideTooltip();
}

const pointer = { downX: 0, downY: 0, down: false, moved: false, clickTimer: null };

function clearPendingClick() {
  if (pointer.clickTimer !== null) {
    window.clearTimeout(pointer.clickTimer);
    pointer.clickTimer = null;
  }
}

function bindCanvasInteractions() {
  const canvas = elements.canvas;
  if (!canvas) return;
  canvas.addEventListener('pointerdown', (event) => {
    pointer.down = true;
    pointer.moved = false;
    pointer.downX = event.clientX;
    pointer.downY = event.clientY;
    if (event.button === 2 || event.button === 1 || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      stopFollowing({ recenter: false });
      nav.tween = null;
    }
    markInteraction();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (pointer.down) {
      if (Math.hypot(event.clientX - pointer.downX, event.clientY - pointer.downY) > 5) {
        pointer.moved = true;
        nav.tween = null;
        hideTooltip();
      }
      return;
    }
    if (event.pointerType === 'mouse') updateHover(pickAt(event.clientX, event.clientY));
  });
  canvas.addEventListener('pointerup', (event) => {
    const wasClick = pointer.down && !pointer.moved && event.button === 0;
    pointer.down = false;
    if (wasClick) handleSceneClick(pickAt(event.clientX, event.clientY));
  });
  canvas.addEventListener('pointercancel', () => { pointer.down = false; });
  canvas.addEventListener('pointerleave', () => updateHover(null));
  canvas.addEventListener('dblclick', (event) => {
    clearPendingClick();
    const hit = pickAt(event.clientX, event.clientY);
    const hitBody = hit?.planet || (hit?.sun ? scene.champion : null);
    if (hitBody) {
      if (scene.lockedKey === hitBody.key) {
        if (performance.now() - scene.lockedAt >= 420) {
          unlockPlanet({ recenter: Boolean(nav.followKey), notify: true });
        }
      } else {
        selectPlanet(hitBody, { follow: true });
      }
    } else {
      resetView();
    }
  });
  canvas.addEventListener('wheel', (event) => {
    if (event.shiftKey && !event.ctrlKey && world.ok) {
      event.preventDefault();
      event.stopImmediatePropagation();
      nav.tween = null;
      stopFollowing({ recenter: false });
      world.controls.autoRotate = false;
      markInteraction();
      const dist = world.camera.position.distanceTo(world.controls.target);
      const refDist = Math.max(dist, 1200);
      const worldPerPx = (2 * refDist * Math.tan((world.camera.fov * Math.PI) / 360)) / Math.max(1, window.innerHeight);
      _panX.setFromMatrixColumn(world.camera.matrix, 0).multiplyScalar(event.deltaX * worldPerPx * 0.85);
      _panY.setFromMatrixColumn(world.camera.matrix, 1).multiplyScalar(-event.deltaY * worldPerPx * 0.85);
      world.camera.position.add(_panX).add(_panY);
      world.controls.target.add(_panX).add(_panY);
      return;
    }
    nav.tween = null;
    markInteraction();
  }, { passive: false, capture: true });
}

function handleSceneClick(hit) {
  markInteraction();
  clearPendingClick();
  const hitBody = hit?.planet || (hit?.sun ? scene.champion : null);
  if (hitBody) {
    if (scene.lockedKey === hitBody.key) {
      if (scene.selectedKey !== hitBody.key) {
        pointer.clickTimer = window.setTimeout(() => {
          pointer.clickTimer = null;
          if (scene.lockedKey === hitBody.key && !scene.selectedKey) {
            selectPlanet(hitBody, { follow: nav.followKey !== hitBody.key });
          }
        }, 240);
      }
    } else {
      selectPlanet(hitBody, { follow: true });
    }
  } else if (hit?.sun) {
    openOverviewCard();
  } else if (scene.selectedKey || scene.overviewOpen) {
    closePlanetCard({ keepFollow: true, keepLock: true });
  }
}

function updateHover(hit) {
  const key = hit?.planet?.key || null;
  const sun = Boolean(hit?.sun);
  if (key === scene.hoveredKey && sun === scene.hoverSun) return;
  scene.hoveredKey = key;
  scene.hoverSun = sun;
  if (elements.canvas) elements.canvas.style.cursor = key || sun ? 'pointer' : '';
  updateOrbitEmphasis();
  if (key) showTooltip(scene.planetByKey.get(key));
  else if (sun) showSunTooltip();
  else hideTooltip();
}

function showTooltip(body) {
  const tip = elements.planetTooltip;
  if (!tip || !body || scene.selectedKey === body.key) {
    hideTooltip();
    return;
  }
  const lockedNote = scene.lockedKey === body.key ? ' · 已锁定（单击查看名片 · 双击取消）' : '';
  const rankText = body.score.rank && body.score.starredTotal ? `第 ${body.score.rank}/${body.score.starredTotal} 名` : '';
  const pctText = body.score.poolPercentile != null ? `TOP 5 后前 ${body.score.poolPercentile}%` : '';
  const meta = body.starred
    ? [`${body.score.points} 分`, body.score.tierShort || '', rankText, pctText].filter(Boolean).map(htmlEscape).join(' · ')
    : '未点 Star';
  tip.innerHTML = `
    <strong>${htmlEscape(displayName(body.profile))}</strong>
    <span>@${htmlEscape(body.profile.github || body.key)}${body.profile.city ? ` · ${htmlEscape(body.profile.city)}` : ''}${htmlEscape(lockedNote)}</span>
    <em style="--tip-color:${htmlEscape(body.color)}">${htmlEscape(orbitLabelForPlanet(body))} · ${meta}</em>`;
  tip.dataset.anchor = body.key;
  tip.hidden = false;
}

function showSunTooltip() {
  const tip = elements.planetTooltip;
  if (!tip || (scene.champion && scene.selectedKey === scene.champion.key)) {
    hideTooltip();
    return;
  }
  const locked = Boolean(scene.champion && scene.lockedKey === scene.champion.key);
  tip.innerHTML = scene.champion
    ? `<strong>👑 ${htmlEscape(displayName(scene.champion.profile))}</strong><span>${locked ? '已锁定 · 单击查看名片 · 双击取消' : '第一名化身恒星 · 点击锁定并查看名片'}</span>`
    : '<strong>恒星王座 · 虚位以待</strong><span>点击查看课堂全貌</span>';
  tip.dataset.anchor = '__sun__';
  tip.hidden = false;
}

function hideTooltip() {
  if (!elements.planetTooltip) return;
  elements.planetTooltip.hidden = true;
  elements.planetTooltip.dataset.anchor = '';
}

function positionTooltip() {
  const tip = elements.planetTooltip;
  if (!tip || tip.hidden || !world.ok) return;
  const anchor = tip.dataset.anchor;
  let sp;
  if (anchor === '__sun__') sp = screenOf(_tmp.set(0, 0, 0), SUN_RADIUS);
  else {
    const body = scene.planetByKey.get(anchor);
    if (!body) return;
    sp = screenOf(body.pos, body.size || 6);
  }
  const width = tip.offsetWidth || 180;
  let left = sp.x + sp.r + 16;
  if (left + width > window.innerWidth - 12) left = sp.x - sp.r - 16 - width;
  const top = clamp(sp.y - 24, 12, window.innerHeight - 90);
  tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

function bindKeyboard() {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable);
    if (document.querySelector('dialog[open]')) return;
    if (event.key === '/' && !typing) {
      event.preventDefault();
      elements.wallSearch?.focus();
      return;
    }
    if (event.key === 'Escape') {
      if (typing && target === elements.wallSearch) {
        if (elements.wallSearch.value) clearSearch();
        else elements.wallSearch.blur();
        return;
      }
      if (scene.selectedKey || scene.overviewOpen) closePlanetCard({ keepFollow: true, keepLock: true });
      else if (scene.lockedKey || nav.followKey) unlockPlanet({ recenter: Boolean(nav.followKey), notify: true });
      else if (scene.tour) setTour(false);
      return;
    }
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    const onControl = target instanceof HTMLElement && target.matches('button, a, summary');
    switch (event.key) {
      case 'ArrowLeft': if (onControl) return; orbitCameraBy(0.16, 0); break;
      case 'ArrowRight': if (onControl) return; orbitCameraBy(-0.16, 0); break;
      case 'ArrowUp': if (onControl) return; orbitCameraBy(0, -0.1); break;
      case 'ArrowDown': if (onControl) return; orbitCameraBy(0, 0.1); break;
      case '+':
      case '=': dollyBy(0.75); break;
      case '-':
      case '_': dollyBy(1.33); break;
      case '0': resetView(); break;
      case 'v':
      case 'V': cyclePreset(); break;
      case ' ':
        if (onControl) return;
        setMotionPaused(!state.motionPaused);
        break;
      case 'c':
      case 'C': setConstellation(!scene.constellation); break;
      case 't':
      case 'T': setTour(!scene.tour); break;
      default: return;
    }
    event.preventDefault();
    markInteraction();
  });
}

/* ================================================================ controls */

function setMotionPaused(paused, { persist = true } = {}) {
  state.motionPaused = Boolean(paused);
  vfxEngine?.setPaused(state.motionPaused);
  document.querySelectorAll('.collector-slot').forEach((slot) => slot.classList.toggle('is-motion-paused', state.motionPaused));
  if (!elements.toggleWallMotion) toast(state.motionPaused ? '已暂停公转（空格继续）' : '公转继续', 1600);
  if (elements.toggleWallMotion) {
    elements.toggleWallMotion.textContent = state.motionPaused ? '继续公转' : '暂停公转';
    elements.toggleWallMotion.classList.toggle('is-active', state.motionPaused);
  }
  if (persist) {
    try {
      window.localStorage.setItem(MOTION_PREF_STORAGE_KEY, state.motionPaused ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  }
}

function setConstellation(on) {
  scene.constellation = Boolean(on);
  elements.btnConstellation?.setAttribute('aria-pressed', String(scene.constellation));
  if (scene.constellation && !scene.links.length) toast('还没有寄语或结对连线：给同学写一句寄语，点亮第一条星座线');
}

function tourCandidates() {
  const top = allBodies().filter((p) => p.rank).sort((a, b) => a.rank - b.rank);
  const fresh = scene.planets.filter((p) => !p.rank && p.freshTag);
  const starred = scene.planets.filter((p) => !p.rank && !p.freshTag && p.starred);
  const list = [...top, ...fresh, ...starred];
  return list.length ? list : scene.planets.slice();
}

function stepTour() {
  const list = tourCandidates();
  if (!list.length) return;
  scene.tourIndex %= list.length;
  selectPlanet(list[scene.tourIndex], { follow: true });
  scene.tourIndex += 1;
}

function setTour(on) {
  scene.tour = Boolean(on);
  elements.btnTour?.setAttribute('aria-pressed', String(scene.tour));
  window.clearInterval(scene.tourTimer);
  scene.tourTimer = null;
  if (scene.tour) {
    scene.tourIndex = 0;
    stepTour();
    scene.tourTimer = window.setInterval(stepTour, 8000);
    toast('巡航模式：每 8 秒飞向下一颗星，拖拽画面即可退出', 3200);
  }
}

function focusPlanetByKey(key) {
  const body = scene.planetByKey.get(String(key || '').toLowerCase());
  if (!body) return;
  if (scene.tour) setTour(false);
  selectPlanet(body, { follow: true });
  if (body.rank) {
    addEffect({ type: 'shock', key: body.key, dur: 1.6, color: '255, 209, 102', maxR: 160 });
  }
}

function bindHudControls() {
  elements.btnZoomIn?.addEventListener('click', () => dollyBy(0.72));
  elements.btnZoomOut?.addEventListener('click', () => dollyBy(1.38));
  elements.btnZoomReset?.addEventListener('click', cyclePreset);
  elements.btnConstellation?.addEventListener('click', () => setConstellation(!scene.constellation));
  elements.btnTour?.addEventListener('click', () => setTour(!scene.tour));
  elements.toggleWallMotion?.addEventListener('click', () => setMotionPaused(!state.motionPaused));
  elements.openOverview?.addEventListener('click', openOverviewCard);

  try {
    if (window.localStorage.getItem(MOTION_PREF_STORAGE_KEY) === '1') setMotionPaused(true, { persist: false });
  } catch {
    // Ignore storage errors
  }

  elements.planetCardHost?.addEventListener('click', (event) => {
    const emblem = event.target.closest('[data-star-emblem]');
    if (emblem) {
      const body = scene.planetByKey.get(emblem.getAttribute('data-star-emblem'));
      const card = emblem.closest('.profile-card');
      if (body && card) {
        if (body.recipe) vfxEngine?.triggerSurge(card);
        const icon = body.recipe ? '👑' : '★';
        toast(`${icon} @${body.profile.github || body.key} · ${collectorTierCaption(body)}`, 4200);
      }
      return;
    }
    if (event.target.closest('[data-close-card]')) {
      closePlanetCard({ keepFollow: true, keepLock: true, notify: true });
      return;
    }
    const cheersTrigger = event.target.closest('[data-cheers-trigger]');
    if (cheersTrigger) {
      const body = scene.planetByKey.get(cheersTrigger.getAttribute('data-cheers-trigger'));
      if (body) openCheersOverlay(body.profile);
      return;
    }
    const focus = event.target.closest('[data-focus-planet]');
    if (focus) {
      focusPlanetByKey(focus.getAttribute('data-focus-planet'));
      return;
    }
    const follow = event.target.closest('[data-follow]');
    if (follow) {
      const key = follow.getAttribute('data-follow');
      if (nav.followKey === key) applyPreset(nav.preset);
      else followPlanet(key);
      const body = scene.planetByKey.get(key);
      if (body) renderPlanetCard(body);
      return;
    }
    if (event.target.closest('[data-open-activity]')) openActivityPanel();
    if (event.target.closest('[data-open-overview]')) openOverviewCard();
  });
}

/* ================================================================== search */

const search = { activeIndex: -1, results: [] };

function applySearchFilter() {
  const query = scene.query;
  if (!query) {
    scene.matchKeys = null;
    return;
  }
  scene.matchKeys = new Set(allBodies().filter((p) => p.searchText.includes(query)).map((p) => p.key));
}

function renderSearchResults() {
  const list = elements.searchResults;
  const input = elements.wallSearch;
  if (!list || !input) return;
  const query = scene.query;
  elements.clearWallSearch.hidden = !query;
  if (!query) {
    list.hidden = true;
    list.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    return;
  }
  const matches = scene.planets
    .filter((p) => scene.matchKeys?.has(p.key))
    .sort((a, b) => (a.score?.rank || 9999) - (b.score?.rank || 9999) || b.score.points - a.score.points);
  search.results = matches.slice(0, 8);
  if (search.activeIndex >= search.results.length) search.activeIndex = search.results.length - 1;

  list.innerHTML = search.results.length
    ? search.results.map((planet, index) => `
        <li role="option" id="search-opt-${index}" aria-selected="${index === search.activeIndex}" data-focus-planet="${htmlEscape(planet.key)}" class="${index === search.activeIndex ? 'is-active' : ''}">
          <img class="avatar-image" src="${htmlEscape(avatarForProfile(planet.profile, 64))}" alt="" width="28" height="28" loading="lazy" decoding="async" data-fallback-src="${AVATAR_WARNING_FALLBACK}" />
          <span class="result-copy">
            <strong>${htmlEscape(displayName(planet.profile))}</strong>
            <small>@${htmlEscape(planet.profile.github || planet.key)}</small>
          </span>
          <span class="result-orbit" style="--orbit-color:${htmlEscape(planet.color)}">${htmlEscape(orbitLabelForPlanet(planet))}</span>
        </li>`).join('')
    : `<li class="search-empty" role="presentation">没有匹配的同学${matches.length ? '' : '，换个关键词试试'}</li>`;
  if (matches.length > search.results.length) {
    list.insertAdjacentHTML('beforeend', `<li class="search-more" role="presentation">还有 ${matches.length - search.results.length} 位匹配，继续输入缩小范围</li>`);
  }
  list.hidden = false;
  input.setAttribute('aria-expanded', 'true');
  if (search.activeIndex >= 0) input.setAttribute('aria-activedescendant', `search-opt-${search.activeIndex}`);
  else input.removeAttribute('aria-activedescendant');
}

function clearSearch() {
  if (elements.wallSearch) elements.wallSearch.value = '';
  scene.query = '';
  search.activeIndex = -1;
  applySearchFilter();
  renderSearchResults();
}

function chooseSearchResult(key) {
  const planet = scene.planetByKey.get(key);
  clearSearch();
  elements.wallSearch?.blur();
  if (planet) focusPlanetByKey(planet.key);
}

function bindSearch() {
  const input = elements.wallSearch;
  if (!input) return;
  input.addEventListener('input', () => {
    scene.query = input.value.trim().toLowerCase();
    search.activeIndex = scene.query ? 0 : -1;
    applySearchFilter();
    renderSearchResults();
  });
  input.addEventListener('keydown', (event) => {
    if (!search.results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      search.activeIndex = (search.activeIndex + delta + search.results.length) % search.results.length;
      renderSearchResults();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const planet = search.results[Math.max(0, search.activeIndex)];
      if (planet) chooseSearchResult(planet.key);
    }
  });
  elements.searchResults?.addEventListener('pointerdown', (event) => {
    const option = event.target.closest('[data-focus-planet]');
    if (!option) return;
    event.preventDefault();
    chooseSearchResult(option.getAttribute('data-focus-planet'));
  });
  elements.clearWallSearch?.addEventListener('click', () => {
    clearSearch();
    input.focus();
  });
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

/* ------------------------------------------------- collector card (tiered) */

function collectorCardMarkup(body) {
  const profile = body.profile;
  const score = body.score;
  const recipe = body.recipe;
  const isStarred = Boolean(recipe);
  const name = htmlEscape(displayName(profile));
  const github = htmlEscape(profile.github || body.key);
  const motto = htmlEscape(profile.motto || '今天完成我的第一个开源 PR');
  const city = htmlEscape(profile.city || '教室');
  const classes = ['profile-card'];
  if (isStarred) classes.push('is-starred', `star-tone-${recipe.theme.tone}`, `star-vfx-tier-${recipe.vfxTier}`);
  if (score.isTop5) classes.push('is-top5-card');
  if (body.freshTag) classes.push('is-fresh-arrival');

  const breakdown = formatScoreBreakdownText(score);
  const nextHint = !score.starred
    ? '点亮仓库 Star 即可直接解锁顶格专属皮肤与破框特效'
    : '已解锁顶格专属皮肤与破框特效';
  const starData = isStarred
    ? ` data-star-theme="${recipe.theme.id}" data-star-vfx="${recipe.vfx.id}" data-star-vfx-tier="${recipe.vfxTier}" data-star-spectrum="${recipe.spectrum.id}" data-star-pattern="${recipe.pattern.id}" data-star-badge="${recipe.badge.id}" style="--star-hue-shift:${recipe.hueShift}deg;--sheen-delay:-${((recipe.sparkSeed * 7.2) / 100).toFixed(2)}s"`
    : '';
  const tierSuffix = score.tierShort ? ` · ${htmlEscape(score.tierShort)}` : '';
  const scoreMeta = score.starred
    ? `<span class="meta-dot" aria-hidden="true">·</span><span class="meta-score is-tier-${score.vfxTier}${score.isTop5 ? ' is-top5' : ''}" title="${htmlEscape(`${score.points} 分（${score.tierLabel}）｜${breakdown}｜${nextHint}`)}">${score.isTop5 ? `TOP ${score.rank} ` : ''}${score.points}分${tierSuffix}</span>`
    : `<span class="meta-dot" aria-hidden="true">·</span><span class="meta-score is-unstarred" title="${htmlEscape(nextHint)}">点star开放积分系统</span>`;
  const layers = isStarred
    ? `
      <div class="card-surface" aria-hidden="true">
        <div class="star-pattern-layer">${starPatternSvg(recipe.pattern.id)}</div>
        <div class="star-foil-layer"></div>
      </div>
      <button type="button" class="star-emblem-btn" data-star-emblem="${htmlEscape(body.key)}" title="${htmlEscape(`顶格专属 #${recipe.serial}｜${recipe.vfx.lineage}·${recipe.vfx.label}｜${breakdown}`)}" aria-label="${name} 的星标卡：顶格专属「${htmlEscape(recipe.vfx.lineage)}」，点击释放破框特效">
        ${starBadgeSvg(recipe.badge.id, recipe.uid)}
      </button>`
    : '';

  return `
    <article class="${classes.join(' ')}" data-profile-key="${htmlEscape(body.key)}"${starData}>
      ${layers}
      ${body.freshTag ? `<span class="fresh-pill">${htmlEscape(body.freshTag)}</span>` : ''}
      <header class="profile-top">
        <img class="avatar-image" src="${htmlEscape(avatarForProfile(profile, 160))}" alt="${name} 的头像" width="38" height="38" decoding="async" data-fallback-src="${AVATAR_WARNING_FALLBACK}" />
        <div class="identity"><h3>${name}</h3></div>
      </header>
      <p class="motto" title="${motto}">${motto}</p>
      <div class="identity-meta">
        <div class="identity-meta-text">
          <a class="handle" href="${githubProfileUrl(profile.github || '')}" target="_blank" rel="noreferrer">@${github}</a>
          <span class="meta-dot" aria-hidden="true">·</span>
          <span class="meta-city">${city}</span>
          ${scoreMeta}
        </div>
      </div>
    </article>`;
}

function collectorTierCaption(body) {
  const recipe = body.recipe;
  if (!recipe) return '默认卡片 · 点亮 Star 即享顶格专属皮肤与破框特效';
  return `${recipe.vfx.lineage}「${recipe.vfx.label}」`;
}

/* ================================================================== panels */

function chipsForKeys(keys, emptyText) {
  if (!keys.length) return `<span class="chip-empty">${htmlEscape(emptyText)}</span>`;
  const shown = keys.slice(0, 6).map((key) => {
    const body = scene.planetByKey.get(key);
    if (!body) return '';
    return `<button type="button" class="planet-chip" data-focus-planet="${htmlEscape(key)}" style="--chip-color:${htmlEscape(body.color)}" title="飞向 @${htmlEscape(body.profile.github || key)}">
      <img class="avatar-image" src="${htmlEscape(avatarForProfile(body.profile, 48))}" alt="" width="18" height="18" loading="lazy" decoding="async" data-fallback-src="${AVATAR_WARNING_FALLBACK}" />
      <span>${htmlEscape(displayName(body.profile))}</span>
    </button>`;
  }).join('');
  return shown + (keys.length > 6 ? `<span class="chip-more">+${keys.length - 6}</span>` : '');
}

function openCard(html) {
  const host = elements.planetCardHost;
  if (!host) return;
  host.innerHTML = html;
  host.hidden = false;
  document.body.classList.add('has-card');
}

function renderPlanetCard(body) {
  if (!body) return;
  const p = body.profile;
  const score = body.score;
  const recipe = body.recipe;
  const cheers = Array.isArray(p.cheers) ? p.cheers : [];
  const latest = cheers.slice().reverse().slice(0, 3);
  const links = scene.linksByKey.get(body.key) || [];
  const sent = links.filter((l) => l.type === 'cheer' && l.fromKey === body.key).map((l) => l.toKey);
  const received = links.filter((l) => l.type === 'cheer' && l.toKey === body.key).map((l) => l.fromKey);
  const partners = links.filter((l) => l.type === 'pair').map((l) => (l.fromKey === body.key ? l.toKey : l.fromKey));
  const following = nav.followKey === body.key;
  const githubUrl = p.github ? githubProfileUrl(p.github) : (state.githubHtmlUrl || '#');
  const repoUrl = state.githubHtmlUrl || 'https://github.com/nanzhi84/open-source-pulse-wall';
  const breakdown = score.breakdown || {};

  let progress = '';
  const promo = score.promotion;
  if (body.starred) {
    if (body.isChampion || body.orbitId === 'sun') {
      const lead = Number(promo?.leadPoints || 0);
      const leadCopy = lead > 0
        ? `已登顶恒星王座 · 领先第 2 名 <b>${lead}</b> 分`
        : ((score.starredTotal || 0) > 1 ? '已登顶恒星王座 · 与第 2 名同分领先' : '已登顶恒星王座 · 第一名化身中央恒星');
      progress = `
        <div class="tier-progress">
          <div class="tier-progress-bar"><span style="width:100%"></span></div>
          <p>${leadCopy}</p>
        </div>`;
    } else if (promo && promo.targetLabel) {
      const pct = clamp(Number(promo.progress) || 0, 0, 100);
      const hintCopy = promo.pointsToTie === 0
        ? `距升入「${htmlEscape(promo.targetLabel)}」（${htmlEscape(promo.targetHint || '')}）仅差 <b>${promo.ranksNeeded}</b> 名（与第 ${promo.targetRank} 名同为 ${promo.thresholdPoints} 分，再得 <b>1</b> 分即可反超）`
        : `距升入「${htmlEscape(promo.targetLabel)}」（${htmlEscape(promo.targetHint || '')}）还差 <b>${promo.ranksNeeded}</b> 名 · 第 ${promo.targetRank} 名门槛 ${promo.thresholdPoints} 分（再得 <b>${promo.pointsToPass}</b> 分即可反超）`;
      progress = `
        <div class="tier-progress">
          <div class="tier-progress-bar"><span style="width:${pct.toFixed(1)}%"></span></div>
          <p>${hintCopy}</p>
        </div>`;
    } else {
      progress = '<div class="tier-progress"><p>继续送出寄语与结对编程，提升星系排名</p></div>';
    }
  } else {
    progress = `
      <a class="star-cta" href="${htmlEscape(repoUrl)}" target="_blank" rel="noreferrer">
        <b>点亮 Star →</b>
        <span>小行星将跃迁进入星系排名轨道，解锁专属星环、卫星与顶格藏品卡</span>
      </a>`;
  }

  const rankSub = body.starred && score.rank && score.starredTotal
    ? `第 ${score.rank}/${score.starredTotal} 名${score.poolPercentile != null ? ` · TOP 5 后前 ${score.poolPercentile}%` : (score.rankPercentile != null ? ` · 全站前 ${score.rankPercentile}%` : '')}`
    : '';
  const rankClass = body.isChampion ? ' is-champion' : (body.rank ? ` is-top5 rank-${body.rank}` : '');
  openCard(`
    <article class="planet-flashcard${body.starred ? ' is-starred' : ''}${rankClass}" style="--planet-color:${htmlEscape(body.color)};--planet-ring:${htmlEscape(body.ringColor)}" ${recipe ? `data-star-theme="${htmlEscape(recipe.theme.id)}"` : ''}>
      <button class="icon-btn card-close" type="button" data-close-card aria-label="关闭名片">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <header class="card-hero">
        <p class="kicker">${htmlEscape(orbitLabelForPlanet(body))}${body.freshTag ? ` <span class="fresh-tag">✦ ${htmlEscape(body.freshTag)}</span>` : ''}</p>
        <div class="collector-slot${state.motionPaused ? ' is-motion-paused' : ''}">${collectorCardMarkup(body)}</div>
        <p class="collector-caption">${htmlEscape(collectorTierCaption(body))}</p>
      </header>

      <section class="card-section card-score">
        <div class="score-big">
          <strong>${body.starred ? score.points : '—'}</strong>
          <span>${body.starred ? (score.tierShort ? `分 · ${htmlEscape(score.tierShort)}` : '分') : '积分未开启'}</span>
        </div>
        ${body.starred ? `
        <dl class="score-split">
          <div><dt>Star</dt><dd>+${breakdown.star || 0}</dd></div>
          <div><dt>寄语</dt><dd>+${breakdown.cheers || 0}</dd></div>
          <div><dt>结对</dt><dd>+${breakdown.pair || 0}</dd></div>
        </dl>` : ''}
        ${rankSub ? `<p class="score-rank-meta">${htmlEscape(rankSub)}</p>` : ''}
      </section>
      ${progress}

      <section class="card-section">
        <h3><i class="dot dot-sent"></i>送出寄语 <span>${sent.length}</span></h3>
        <div class="chip-row">${chipsForKeys(sent, '还没有送出寄语')}</div>
        <h3><i class="dot dot-received"></i>收到寄语 <span>${received.length}</span></h3>
        <div class="chip-row">${chipsForKeys(received, '等待第一条寄语')}</div>
        ${partners.length ? `<h3><i class="dot dot-pair"></i>结对搭档 <span>${partners.length}</span></h3><div class="chip-row">${chipsForKeys(partners, '')}</div>` : ''}
      </section>

      <section class="card-section">
        <h3>同学寄语 <span>${cheers.length}</span>${cheers.length ? `<button type="button" class="text-btn" data-cheers-trigger="${htmlEscape(body.key)}">全部 →</button>` : ''}</h3>
        ${latest.length
          ? `<ul class="card-cheers-list">${latest.map((c) => `<li><span class="cheer-from">@${htmlEscape(c.from)}</span><span class="cheer-message">${htmlEscape(c.message)}</span>${c.ts ? `<time>${htmlEscape(formatRelativeTime(c.ts))}</time>` : ''}</li>`).join('')}</ul>`
          : '<p class="cheers-empty">还没有寄语 · 等同学发来第一束星际电波</p>'}
      </section>

      <footer class="card-actions">
        <button type="button" class="text-btn${following ? ' is-active' : ''}" data-follow="${htmlEscape(body.key)}">${following ? '回到全景' : (body.isChampion ? '飞近恒星' : '镜头跟随')} →</button>
        <a class="text-btn" href="${htmlEscape(githubUrl)}" target="_blank" rel="noreferrer">GitHub 主页 ↗</a>
        ${body.isChampion ? '<button type="button" class="text-btn" data-open-overview>课堂全貌 →</button>' : ''}
      </footer>
    </article>
  `);
  onCollectorCardRendered(body);
}

function openOverviewCard() {
  stopCollectorFx();
  scene.selectedKey = null;
  scene.overviewOpen = true;
  hideTooltip();
  updateOrbitEmphasis();
  const payload = state.lastPayload || {};
  const github = payload.github || {};
  const contributors = payload.contributors || [];
  const cheersTotal = typeof payload.cheersTotal === 'number'
    ? payload.cheersTotal
    : contributors.reduce((sum, c) => sum + (Array.isArray(c.cheers) ? c.cheers.length : 0), 0);
  const repoUrl = state.githubHtmlUrl || 'https://github.com/nanzhi84/open-source-pulse-wall';
  const latestIso = github.latestCommitAt || github.pushedAt || payload.generatedAt;
  const maxCount = Math.max(1, ...ORBITS.map((o) => scene.ringCounts[o.id] || 0));
  const issuesNote = github.configured
    ? `${Number(github.openIssuesTotal ?? 0)} open · ${Math.max(0, Number(github.issuesTotal ?? 0) - Number(github.openIssuesTotal ?? 0))} closed`
    : '连接 GitHub 后可见';
  const champion = scene.champion;

  openCard(`
    <article class="planet-flashcard overview-card">
      <button class="icon-btn card-close" type="button" data-close-card aria-label="关闭课堂全貌">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <header class="card-hero">
        <p class="kicker">课堂全貌</p>
        <h2 class="overview-title">Open Source Pulse Wall</h2>
        <p><a class="card-handle" href="${htmlEscape(repoUrl)}" target="_blank" rel="noreferrer">${htmlEscape(github.repository || 'nanzhi84/open-source-pulse-wall')}</a></p>
      </header>
      <dl class="overview-stats">
        <div><dd>${formatNumber(contributors.length)}</dd><dt>星体</dt></div>
        <div><dd>${formatNumber(cheersTotal)}</dd><dt>寄语</dt></div>
        <div><dd>${github.ok ? formatNumber(github.stars) : '--'}</dd><dt>Star</dt></div>
        <div title="${htmlEscape(issuesNote)}"><dd>${github.configured ? formatCount(github.issuesTotal ?? 0, github.issuesTotalTruncated) : '--'}</dd><dt>Issue</dt></div>
        <div><dd>${github.configured ? formatNumber(github.awaitingReviewTotal ?? 0) : '--'}</dd><dt>待 Review</dt></div>
        <div><dd>${htmlEscape(formatRelativeTime(latestIso) || formatTime(latestIso))}</dd><dt>最后更新</dt></div>
      </dl>
      <section class="card-section">
        <h3>星系结构</h3>
        <ul class="orbit-census">
          <li style="--orbit-color:#ffd166"><span>恒星王座</span><span class="census-bar"><i style="width:${champion ? 100 / maxCount : 0}%"></i></span><b>${champion ? 1 : 0}</b></li>
          ${ORBITS.map((o) => `
            <li style="--orbit-color:${o.color}">
              <span>${htmlEscape(o.label)}</span>
              <span class="census-bar"><i style="width:${(((scene.ringCounts[o.id] || 0) / maxCount) * 100).toFixed(1)}%"></i></span>
              <b>${scene.ringCounts[o.id] || 0}</b>
            </li>`).join('')}
        </ul>
      </section>
      <section class="card-section">
        <h3>最近活动<button type="button" class="text-btn" data-open-activity>全部 →</button></h3>
        <ol class="overview-feed">${state.feed.slice(0, 5).map((item) => `<li data-event-type="${htmlEscape(item.type)}"><i class="feed-dot"></i><span>${htmlEscape(item.message)}</span><time>${htmlEscape(formatRelativeTime(item.time) || formatTime(item.time))}</time></li>`).join('') || '<li><span>等待新的协作动态…</span></li>'}</ol>
      </section>
      <footer class="card-actions">
        <a class="text-btn is-primary" href="${htmlEscape(repoUrl)}#贡献步骤指南" target="_blank" rel="noreferrer">开始贡献 · README ↗</a>
      </footer>
    </article>
  `);
}

function closePlanetCard({ keepFollow = true, keepLock = true, notify = false } = {}) {
  stopCollectorFx();
  const lockRefKey = scene.lockedKey || nav.followKey;
  const lockedBody = keepLock && lockRefKey ? scene.planetByKey.get(lockRefKey) : null;
  if (!keepLock) {
    scene.lockedKey = null;
    scene.lockedAt = 0;
  }
  if (!keepFollow) stopFollowing({ recenter: false });
  scene.selectedKey = null;
  scene.overviewOpen = false;
  if (elements.planetCardHost) {
    elements.planetCardHost.hidden = true;
    elements.planetCardHost.innerHTML = '';
  }
  document.body.classList.remove('has-card');
  updateOrbitEmphasis();
  if (notify && lockedBody) {
    toast(`已收起名片 · 仍锁定「${displayName(lockedBody.profile)}」，按 V 可切全景查看位置，双击取消`, 2600);
  }
}

function refreshOpenCard() {
  if (scene.selectedKey) {
    const body = scene.planetByKey.get(scene.selectedKey);
    if (body) renderPlanetCard(body);
    else closePlanetCard({ keepFollow: false, keepLock: false });
  } else if (scene.overviewOpen) {
    openOverviewCard();
  }
}

function leaderboardOrder() {
  return allBodies().slice().sort((a, b) => {
    if (a.isChampion !== b.isChampion) return a.isChampion ? -1 : 1;
    const ra = a.score.rank || 9999;
    const rb = b.score.rank || 9999;
    if (ra !== rb) return ra - rb;
    if (a.starred !== b.starred) return a.starred ? -1 : 1;
    if (b.score.points !== a.score.points) return b.score.points - a.score.points;
    return displayName(a.profile).localeCompare(displayName(b.profile), 'zh-CN');
  });
}

function leaderboardRow(body, position) {
  const top = body.rank && position <= 5;
  const halo = top ? (TOP5_PALETTE[body.rank]?.halo || '#ffd166') : (body.starred ? body.color : '#64748b');
  const pctNote = body.score.poolPercentile != null ? ` · TOP 5 后前 ${body.score.poolPercentile}%` : '';
  const title = body.starred
    ? `#${position} @${body.profile.github || body.key} · ${body.score.points}分（${body.score.tierLabel}${pctNote}）｜${formatScoreBreakdownText(body.score)}｜点击飞向`
    : `#${position} @${body.profile.github || body.key} · 尚未点 Star｜点击飞向这颗外缘小行星`;
  const classes = [body.isChampion ? 'is-champion' : '', top ? 'is-top' : '', body.starred ? '' : 'is-unstarred'].filter(Boolean).join(' ');
  return `
    <li class="${classes}">
      <button type="button" class="honor-pill is-rank-${position}" data-focus-planet="${htmlEscape(body.key)}" title="${htmlEscape(title)}" style="--halo:${htmlEscape(halo)};--planet-color:${htmlEscape(body.starred ? body.color : '#94a3b8')}">
        <span class="podium-rank">${String(position).padStart(2, '0')}</span>
        <img class="podium-avatar avatar-image" src="${htmlEscape(avatarForProfile(body.profile, 96))}" alt="" width="30" height="30" loading="lazy" decoding="async" data-fallback-src="${AVATAR_WARNING_FALLBACK}" />
        <span class="podium-copy">
          ${body.isChampion ? '<small class="podium-role">恒星王座</small>' : ''}
          <strong>${htmlEscape(displayName(body.profile))}</strong>
          <small>@${htmlEscape(body.profile.github || body.key)}</small>
        </span>
        <span class="podium-pts">${body.starred
          ? `<strong>${body.score.points}</strong><small>${htmlEscape(body.score.tierShort || '')}</small>`
          : '<strong>—</strong><small>未点 Star</small>'}</span>
      </button>
    </li>`;
}

const marquee = { loop: false, height: 0, pausedUntil: 0, hover: false, raf: 0, last: 0, carry: 0 };

function renderHonorRibbon() {
  const panel = elements.honorRibbon;
  const list = elements.honorRibbonList;
  const track = elements.honorRibbonTrack;
  const viewport = elements.podiumViewport;
  if (!panel || !list || !track || !viewport) return;
  panel.hidden = false;
  const order = leaderboardOrder();
  if (elements.rankCount) elements.rankCount.textContent = order.length ? `${order.length} 人` : '';
  const prevScroll = viewport.scrollTop;
  list.innerHTML = order.length
    ? order.map((body, i) => leaderboardRow(body, i + 1)).join('')
    : '<li class="podium-empty">还没有同学上墙。合并第一个 profile PR，就会成为照亮星系的恒星。</li>';
  track.querySelectorAll('.podium-list.is-clone').forEach((el) => el.remove());

  window.requestAnimationFrame(() => {
    marquee.height = list.offsetHeight;
    marquee.loop = order.length > 1 && marquee.height > viewport.clientHeight + 8;
    viewport.classList.toggle('is-looping', marquee.loop);
    if (marquee.loop) {
      const clone = list.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('is-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('button, a, [tabindex]').forEach((el) => { el.tabIndex = -1; });
      track.append(clone);
    }
    viewport.scrollTop = marquee.loop ? prevScroll % Math.max(1, marquee.height) : 0;
  });
}

function bindLeaderboard() {
  const viewport = elements.podiumViewport;
  if (!viewport) return;
  viewport.addEventListener('mousedown', (event) => {
    if (event.target.closest('.podium-list.is-clone')) event.preventDefault();
  });
  viewport.addEventListener('click', (event) => {
    const button = event.target.closest('[data-focus-planet]');
    if (button) focusPlanetByKey(button.getAttribute('data-focus-planet'));
  });
  const hold = () => { marquee.pausedUntil = performance.now() + 4000; };
  viewport.addEventListener('pointerenter', () => { marquee.hover = true; });
  viewport.addEventListener('pointerleave', () => { marquee.hover = false; hold(); });
  viewport.addEventListener('focusin', () => { marquee.hover = true; });
  viewport.addEventListener('focusout', () => { marquee.hover = false; hold(); });
  viewport.addEventListener('wheel', hold, { passive: true });
  viewport.addEventListener('touchstart', hold, { passive: true });
  viewport.addEventListener('scroll', () => {
    const loopHeight = elements.honorRibbonList?.offsetHeight || marquee.height;
    if (loopHeight > 0) marquee.height = loopHeight;
    if (!marquee.loop || marquee.height < 1) return;
    if (viewport.scrollTop >= marquee.height) viewport.scrollTop -= marquee.height;
    else if (viewport.scrollTop <= 0 && (marquee.hover || marquee.pausedUntil > performance.now())) viewport.scrollTop += marquee.height;
  }, { passive: true });

  const step = (now) => {
    marquee.raf = window.requestAnimationFrame(step);
    const dt = marquee.last ? Math.min(0.05, (now - marquee.last) / 1000) : 0;
    marquee.last = now;
    if (!marquee.loop || marquee.hover || now < marquee.pausedUntil || state.motionPaused || prefersReducedMotion() || document.hidden) return;
    marquee.carry += dt * 16;
    const whole = Math.floor(marquee.carry);
    if (!whole) return;
    marquee.carry -= whole;
    viewport.scrollTop += whole;
  };
  marquee.raf = window.requestAnimationFrame(step);
}

/* ------------------------------------------------------- card VFX engine */

let vfxEngine = null;
const cardFx = { key: '', timer: 0, ambient: 0 };

function initVfxEngine() {
  if (!elements.vfxOverlay || typeof window.PulseWallVfxEngine !== 'function') return;
  vfxEngine = new window.PulseWallVfxEngine({
    canvas: elements.vfxOverlay,
    wallEl: elements.planetCardHost,
    viewportEl: null,
    ambient: false,
    maxEffects: 6
  });
  if (state.motionPaused) vfxEngine.setPaused(true);
}

function currentCollectorCard() {
  return elements.planetCardHost?.querySelector('.collector-slot .profile-card') || null;
}

function onCollectorCardRendered(body) {
  window.clearTimeout(cardFx.timer);
  window.clearInterval(cardFx.ambient);
  if (!vfxEngine || !body.recipe) {
    cardFx.key = body.key;
    return;
  }
  const fresh = cardFx.key !== body.key;
  cardFx.key = body.key;
  if (fresh) {
    // first open: let the card slide in, then break the frame
    cardFx.timer = window.setTimeout(() => {
      const card = currentCollectorCard();
      if (card) vfxEngine.focusTriggerCard(card, { intensity: 1.38 });
    }, 520);
  }
  // keep the card alive while it stays open
  cardFx.ambient = window.setInterval(() => {
    const card = currentCollectorCard();
    if (card && !state.motionPaused) vfxEngine.triggerSurge(card);
  }, 7000);
}

function stopCollectorFx() {
  window.clearTimeout(cardFx.timer);
  window.clearInterval(cardFx.ambient);
  cardFx.key = '';
  vfxEngine?.setHoveredCard(null);
  vfxEngine?.clearAll();
}

function bindCollectorCard() {
  const host = elements.planetCardHost;
  if (!host) return;
  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
  let active = null;
  let raf = 0;
  let px = 0.5;
  let py = 0.5;

  const clear = (card) => {
    if (!card) return;
    card.classList.remove('is-tilting');
    ['--pointer-x', '--pointer-y', '--tilt-x', '--tilt-y', '--foil-angle'].forEach((prop) => card.style.removeProperty(prop));
  };
  const flush = () => {
    raf = 0;
    if (!active) return;
    const dx = px - 0.5;
    const dy = py - 0.5;
    active.style.setProperty('--pointer-x', `${(px * 100).toFixed(1)}%`);
    active.style.setProperty('--pointer-y', `${(py * 100).toFixed(1)}%`);
    active.style.setProperty('--tilt-x', `${(-dy * 9).toFixed(2)}deg`);
    active.style.setProperty('--tilt-y', `${(dx * 10).toFixed(2)}deg`);
    active.style.setProperty('--foil-angle', `${(115 + dx * 48 - dy * 30).toFixed(1)}deg`);
  };

  host.addEventListener('pointermove', (event) => {
    const card = event.target.closest('.collector-slot .profile-card.is-starred');
    if (card !== active) {
      clear(active);
      active = card;
      vfxEngine?.setHoveredCard(card || null);
      if (active) active.classList.add('is-tilting');
    }
    if (!active || state.motionPaused || prefersReducedMotion() || !finePointer?.matches) return;
    const rect = active.getBoundingClientRect();
    px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    if (!raf) raf = window.requestAnimationFrame(flush);
  });
  host.addEventListener('pointerleave', () => {
    clear(active);
    active = null;
    vfxEngine?.setHoveredCard(null);
  });
}

/* =================================================================== feed */

function feedMarkup(items, { compact = false } = {}) {
  return items.map((item) => {
    const type = htmlEscape(item.type || 'generic');
    const timeLabel = compact ? (formatRelativeTime(item.time) || formatTime(item.time)) : formatTime(item.time);
    return `<li data-event-type="${type}"><span class="feed-dot" aria-hidden="true"></span><span class="feed-text">${htmlEscape(item.message)}</span><time>${htmlEscape(timeLabel)}</time></li>`;
  }).join('');
}

function renderFeed() {
  if (elements.liveFeed) {
    elements.liveFeed.innerHTML = state.feed.length
      ? feedMarkup(state.feed.slice(0, VISIBLE_FEED_ITEMS), { compact: true })
      : '<li class="empty-activity"><span class="feed-text">等待新的协作动态…</span></li>';
  }
  if (elements.activityList) {
    elements.activityList.innerHTML = state.feed.length
      ? feedMarkup(state.feed)
      : '<li class="empty-activity"><span class="feed-text">暂无活动记录</span></li>';
  }
  if (elements.activityCount) {
    elements.activityCount.textContent = state.feed.length ? `已记录 ${state.feed.length} 条课堂活动` : '等待活动记录';
  }
}

function addFeed(message, time = new Date().toISOString(), type = 'generic') {
  state.feed.unshift({ message, time, type });
  state.feed = state.feed.slice(0, MAX_FEED_ITEMS);
  renderFeed();
}

/* ================================================================ dialogs */

function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function openActivityPanel() {
  renderFeed();
  openDialog(elements.activityPanel);
}

function openCheersOverlay(profile) {
  if (!profile || !elements.cheersPanel) return;
  const cheers = Array.isArray(profile.cheers) ? profile.cheers : [];
  const display = displayName(profile);
  if (elements.cheersTitle) {
    elements.cheersTitle.textContent = profile.github ? `${display} (@${profile.github}) 收到的寄语` : `${display} 收到的寄语`;
  }
  if (elements.cheersSubtitle) {
    elements.cheersSubtitle.textContent = cheers.length ? `共 ${cheers.length} 条寄语，按时间倒序` : '还没有寄语';
  }
  if (elements.cheersFullList) {
    elements.cheersFullList.innerHTML = cheers.length
      ? cheers.slice().reverse().map((cheer) => `
          <li>
            <time>${htmlEscape(cheer.ts ? formatRelativeTime(cheer.ts) : '—')}</time>
            <div class="cheer-line">
              <span class="cheer-from">@${htmlEscape(cheer.from || 'unknown')}</span>
              <span class="cheer-message">${htmlEscape(cheer.message || '')}</span>
            </div>
          </li>`).join('')
      : '<li class="empty-activity"><span class="feed-text">暂无寄语</span></li>';
    elements.cheersFullList.scrollTop = 0;
  }
  openDialog(elements.cheersPanel);
}

function bindDialogs() {
  elements.viewAllFeed?.addEventListener('click', openActivityPanel);
  // Light-dismiss fallback where <dialog closedby="any"> is unsupported.
  if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (event, dialog) => {
      const r = dialog.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (event) => { pressedOutside = outside(event, dialog); });
      dialog.addEventListener('pointerup', (event) => {
        if (pressedOutside && outside(event, dialog)) dialog.close();
      });
    }
  }
}

function bindAvatarFallback() {
  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (!image.dataset.fallbackSrc || image.dataset.fallbackApplied === 'true') return;
    image.dataset.fallbackApplied = 'true';
    image.src = image.dataset.fallbackSrc || AVATAR_WARNING_FALLBACK;
    image.alt = '头像图片不可用';
  }, true);
}

/* ============================================================ live status */

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
  if (elements.starCount) elements.starCount.textContent = github?.ok ? formatNumber(github.stars) : '--';
  if (state.githubHtmlUrl) {
    if (elements.openTopRepo) elements.openTopRepo.href = state.githubHtmlUrl;
    if (elements.starBadgeLink) elements.starBadgeLink.href = state.githubHtmlUrl;
  }
  if (elements.refreshWall) elements.refreshWall.hidden = !canManualRefresh();
}

function updateStats(payload) {
  const contributors = payload.contributors || [];
  const github = payload.github || {};
  const cheersTotal = typeof payload.cheersTotal === 'number'
    ? payload.cheersTotal
    : contributors.reduce((sum, person) => sum + (Array.isArray(person.cheers) ? person.cheers.length : 0), 0);

  if (elements.statCount) elements.statCount.textContent = formatNumber(contributors.length);
  if (elements.statCheers) elements.statCheers.textContent = formatNumber(cheersTotal);
  if (elements.statValidation) {
    elements.statValidation.textContent = payload.ok ? '100%' : '待修复';
    elements.statValidation.closest('.stat-chip')?.classList.toggle('is-error', !payload.ok);
  }
  if (elements.statPulse) {
    const latestIso = github.latestCommitAt || github.pushedAt || payload.generatedAt;
    elements.statPulse.textContent = formatRelativeTime(latestIso) || formatTime(latestIso);
    if (latestIso) elements.statPulse.setAttribute('datetime', latestIso);
  }
  if (elements.statIssues) {
    elements.statIssues.textContent = github.configured ? formatCount(Number(github.issuesTotal ?? 0), github.issuesTotalTruncated) : '--';
  }
  if (elements.statCardIssues) {
    elements.statCardIssues.title = !github.configured
      ? '连接 GitHub 后可见'
      : `${Number(github.openIssuesTotal ?? 0)} open · ${Math.max(0, Number(github.issuesTotal ?? 0) - Number(github.openIssuesTotal ?? 0))} closed`;
  }
  if (elements.statReview) {
    elements.statReview.textContent = github.configured ? formatNumber(Number(github.awaitingReviewTotal ?? 0)) : '--';
  }
  if (elements.statCardReview) {
    const open = Number(github.pullRequestsTotal ?? 0);
    elements.statCardReview.title = github.configured
      ? (open > 0 ? `共 ${formatCount(open, github.pullRequestsTotalTruncated)} 个 open PR` : '暂无待审 PR')
      : '连接 GitHub 后可见';
  }
}

function updateValidation(payload) {
  const box = elements.validationBox;
  if (!box) return;
  box.classList.toggle('success', Boolean(payload.ok));
  box.classList.toggle('error', !payload.ok);
  if (payload.ok) {
    box.classList.remove('show');
    box.innerHTML = '';
    return;
  }
  const errors = payload.errors || [];
  box.innerHTML = `
    <strong>校验失败</strong>
    <p>修复下列问题后，星系会自动恢复到最新数据。</p>
    <ul>${errors.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul>
  `;
  box.classList.add('show');
}

/* ==================================================== live event detection */

function queueEffect(effect) {
  state.pendingEffects.push(effect);
}

function detectNewContributors(payload) {
  const incoming = new Set((payload.contributors || []).map(profileKey).filter(Boolean));
  const fresh = [];
  for (const key of incoming) {
    if (!state.knownHandles.has(key)) fresh.push(key);
  }
  const firstLoad = state.lastOk === null;
  state.knownHandles = incoming;
  if (firstLoad || !fresh.length) return;
  fresh.forEach((key) => {
    markProfileFresh(key, '刚上墙');
    queueEffect({ kind: 'arrive', key });
  });
  addFeed(`新增 ${fresh.length} 位贡献者: ${fresh.join(', ')}`, payload.generatedAt, 'contributor');
}

function detectNewCheers(payload) {
  const all = [];
  for (const profile of payload.contributors || []) {
    const owner = profileKey(profile);
    for (const cheer of profile.cheers || []) {
      all.push({ id: `${owner}|${String(cheer.from || '').toLowerCase()}|${String(cheer.message || '').trim()}`, owner, profile, cheer });
    }
  }
  if (!state.bootstrappedCheers) {
    state.knownCheerKeys = new Set(all.map((item) => item.id));
    state.bootstrappedCheers = true;
    return;
  }
  const fresh = all.filter((item) => !state.knownCheerKeys.has(item.id));
  fresh.forEach((item) => state.knownCheerKeys.add(item.id));
  for (const { owner, profile, cheer } of fresh) {
    markProfileFresh(owner, '刚收寄语');
    queueEffect({ kind: 'cheer', fromKey: String(cheer.from || '').toLowerCase(), toKey: owner });
    addFeed(`@${cheer.from} → @${profile.github || profile.name || 'unknown'}: ${cheer.message}`, cheer.ts || payload.generatedAt, 'cheer');
  }
}

function detectNewStars(payload) {
  const starredNow = new Map();
  for (const profile of payload.contributors || []) {
    const key = profileKey(profile);
    if (key && state.starRecipes.has(key)) starredNow.set(key, profile.github || profile.name || key);
  }
  if (!state.bootstrappedStars) {
    state.knownStarredHandles = new Set(starredNow.keys());
    state.bootstrappedStars = true;
    return;
  }
  for (const [key, display] of starredNow.entries()) {
    if (state.knownStarredHandles.has(key)) continue;
    state.knownStarredHandles.add(key);
    markProfileFresh(key, '点亮 Star');
    queueEffect({ kind: 'star', key, message: `⭐ @${display} 点亮 Star，行星获得星环并跃迁入轨！` });
    addFeed(`@${display} 点亮了 Star，解锁行星星环`, payload.generatedAt, 'star');
  }
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
      rank: score.isTop5 ? score.rank : 0,
      display: profile.github || profile.name || key,
      tierLabel: score.tierLabel
    });
  }
  if (!state.bootstrappedTiers) {
    state.knownTiersByHandle = current;
    state.bootstrappedTiers = true;
    return;
  }
  for (const [key, info] of current.entries()) {
    const prev = state.knownTiersByHandle.get(key);
    if (!prev) continue;
    if (info.rank && (!prev.rank || info.rank < prev.rank)) {
      markProfileFresh(key, '跃迁内环');
      queueEffect({ kind: 'tier', key, message: info.rank === 1 ? `👑 @${info.display} 以 ${info.points} 分登顶，化身中央恒星！` : `🚀 @${info.display} 跃迁进入 TOP ${info.rank} 内环（${info.points} 分）` });
    } else if (prev.tier > 0 && info.tier > prev.tier) {
      markProfileFresh(key, '刚进化');
      queueEffect({ kind: 'tier', key, message: `✦ @${info.display} 升阶「${info.tierLabel}」，行星飞向更内侧轨道` });
      addFeed(`@${info.display} 升阶至「${info.tierLabel}」`, payload.generatedAt, 'star');
    } else if (info.points > prev.points) {
      markProfileFresh(key, '刚加分');
    }
  }
  state.knownTiersByHandle = current;
}

function flushPendingEffects() {
  const effects = state.pendingEffects.splice(0);
  if (!effects.length) return;
  let bannerMessage = '';
  effects.forEach((effect, index) => {
    const delay = index * 0.35;
    if (effect.kind === 'arrive') {
      const planet = scene.planetByKey.get(effect.key);
      if (!planet) return;
      planet.hidden = true;
      const a = Math.random() * TAU;
      addEffect({
        type: 'meteor',
        toKey: planet.key,
        from: { x: Math.cos(a) * 56000, y: 14000, z: Math.sin(a) * 56000 },
        dur: 2.4,
        t0: scene.time + delay,
        color: '186, 230, 253',
        onDone: () => {
          planet.hidden = false;
          planet.alpha = 0.4;
          addEffect({ type: 'shock', key: planet.key, dur: 1.6, color: '186, 230, 253', maxR: 180 });
        }
      });
      bannerMessage = bannerMessage || `🌠 新星 @${planet.profile.github || planet.key} 加入星系！`;
    } else if (effect.kind === 'cheer') {
      const from = scene.planetByKey.get(effect.fromKey);
      const to = scene.planetByKey.get(effect.toKey);
      if (!to) return;
      if (from) {
        addEffect({
          type: 'comet',
          fromKey: from.key,
          toKey: to.key,
          dur: 1.8,
          t0: scene.time + delay,
          color: '244, 114, 182',
          onDone: () => addEffect({ type: 'shock', key: to.key, dur: 1.2, color: '244, 114, 182', maxR: 120 })
        });
      } else {
        addEffect({ type: 'shock', key: to.key, dur: 1.2, t0: scene.time + delay, color: '244, 114, 182', maxR: 120 });
      }
    } else if (effect.kind === 'star' || effect.kind === 'tier') {
      const planet = scene.planetByKey.get(effect.key);
      if (!planet) return;
      addEffect({ type: 'shock', key: planet.key, dur: 1.8, t0: scene.time + delay, color: '255, 209, 102', maxR: 200 });
      bannerMessage = effect.message || bannerMessage;
    }
  });
  if (bannerMessage) showJumpBanner(bannerMessage);
}

/* ============================================================ apply state */

function preserveStargazersWhenDegraded(payload) {
  const github = payload?.github;
  const incomingList = Array.isArray(github?.stargazers) ? github.stargazers : [];
  const degraded = Boolean(github?.stargazersWarning) &&
    incomingList.length === 0 &&
    Number(github?.stars || 0) > 0 &&
    state.stargazerSet.size > 0;
  if (!degraded || !Array.isArray(payload?.contributors)) return payload;

  const preservedLogins = Array.from(state.stargazerSet);
  const hydratedScores = new Map();
  const hydrated = payload.contributors.map((profile) => {
    const key = profileKey(profile);
    const handleKey = String(profile?.github || '').trim().toLowerCase();
    const isStarred = Boolean(profile?.starred) || (Boolean(handleKey) && state.stargazerSet.has(handleKey));
    const prevScore = profile.score || {};
    const prevBreakdown = prevScore.breakdown || {};
    const cheersPts = Number(prevBreakdown.cheers || 0);
    const pairPts = Number(prevBreakdown.pair || 0);
    const starPts = isStarred ? 1 : 0;
    const points = isStarred ? starPts + cheersPts + pairPts : Number(prevScore.points || cheersPts + pairPts);
    const score = {
      ...prevScore,
      points,
      starred: isStarred,
      breakdown: {
        ...prevBreakdown,
        star: starPts,
        cheers: cheersPts,
        pair: pairPts
      }
    };
    if (key) hydratedScores.set(key, score);
    return {
      ...profile,
      starred: isStarred,
      score
    };
  });

  applyRankPercentileToProfiles(hydrated, hydratedScores);
  hydrated.forEach((profile) => {
    const key = profileKey(profile);
    if (key && hydratedScores.has(key)) profile.score = hydratedScores.get(key);
  });

  return { ...payload, contributors: hydrated, github: { ...github, stargazers: preservedLogins } };
}

function updateScene(payload) {
  const contributors = payload.contributors || [];
  assignStarRecipes(contributors);
  detectNewStars(payload);
  detectTierEvolutions(payload);
  state.wallContributors = contributors;
  syncPlanetsFromContributors(contributors);
  flushPendingEffects();
  renderHonorRibbon();
  if (scene.query) renderSearchResults();
  refreshOpenCard();
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

function applyState(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object') return;
  const payload = preserveStargazersWhenDegraded(rawPayload);
  const firstLoad = state.lastOk === null;
  state.lastPayload = payload;
  updateGithubSync(payload.github);
  updateStats(payload);
  updateValidation(payload);
  detectNewContributors(payload);
  detectNewCheers(payload);
  updateScene(payload);
  syncGithubEvents(payload);

  const fp = String(payload.fingerprint || '');
  if (state.lastOk !== payload.ok) {
    addFeed(payload.ok ? '数据恢复正常，星系已刷新' : '数据校验失败，等待修复', payload.generatedAt, 'validation');
  } else if (!fp || fp !== state.lastFingerprint) {
    addFeed(payload.message || '收到一次数据刷新', payload.generatedAt, 'pulse');
  }
  if (firstLoad || (fp && fp !== state.lastFingerprint)) {
    ['top5', 'tier2', 'tier1'].forEach((orbitId, i) => addEffect({ type: 'sunpulse', orbitId, dur: 4.2, t0: scene.time + (firstLoad ? 2 : 0) + i * 0.35 }));
  }

  state.lastOk = payload.ok;
  if (fp) state.lastFingerprint = fp;
  state.lastPayloadTime = Math.max(state.lastPayloadTime, payloadTimestamp(payload));
  writeCachedState(payload);
}

/* ===================================================== refresh & cooldown */

function setRefreshButtonState(label, disabled, { busy = false } = {}) {
  if (elements.refreshWall) {
    elements.refreshWall.disabled = disabled;
    elements.refreshWall.classList.toggle('is-busy', Boolean(busy));
  }
  if (elements.refreshWallLabel) elements.refreshWallLabel.textContent = label;
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
    window.localStorage.setItem(REFRESH_COOLDOWN_STORAGE_KEY, String(Date.now() + Math.max(1, Math.floor(seconds)) * 1000));
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
    const until = Number(window.localStorage.getItem(REFRESH_COOLDOWN_STORAGE_KEY) || 0);
    if (!Number.isFinite(until) || until <= Date.now()) return 0;
    return Math.ceil((until - Date.now()) / 1000);
  } catch {
    return 0;
  }
}

function startRefreshCooldown(seconds, { persist = true } = {}) {
  window.clearInterval(state.refreshCooldownTimer);
  state.refreshCooldownTimer = null;
  let remaining = Math.max(1, Math.floor(seconds));
  if (persist) savePersonalRefreshCooldown(remaining);
  setRefreshButtonState(`${formatCooldownDuration(remaining)}后可刷新`, true);
  state.refreshCooldownTimer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      window.clearInterval(state.refreshCooldownTimer);
      state.refreshCooldownTimer = null;
      clearPersonalRefreshCooldown();
      setRefreshButtonState(REFRESH_LABEL_DEFAULT, false);
      return;
    }
    setRefreshButtonState(`${formatCooldownDuration(remaining)}后可刷新`, true);
  }, 1000);
}

function buildRefreshToastMessage(data) {
  const git = data?.git || {};
  const github = data?.github || {};
  const parts = [];
  if (git.ok && !git.skipped) parts.push(git.pulled > 0 ? `贡献者：已同步 ${git.pulled} 个新提交` : '贡献者：已是最新');
  else if (git.skipped) parts.push(`贡献者未同步（${git.reason || '已跳过'}）`);
  else if (git.reason) parts.push(`贡献者同步失败：${git.reason}`);
  if (github.ok) parts.push('已刷新星标与动态');
  else if (github.configured === false) parts.push('未连接 GitHub');
  else if (github.message) parts.push(`刷新失败 - ${github.message}`);
  return parts.length ? parts.join(' · ') : '已尝试刷新';
}

async function manuallyRefreshWall() {
  if (state.refreshing || !canManualRefresh()) return;
  const endpoint = state.dataMode === 'api' ? 'api/refresh' : `${refreshApiBase()}/api/refresh`;
  state.refreshing = true;
  setRefreshButtonState('正在刷新…', true, { busy: true });
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' } });
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      if (data?.state) applyState(data.state);
      const retrySeconds = Math.max(1, Math.ceil((data.retryInMs || 180000) / 1000));
      startRefreshCooldown(retrySeconds);
      toast(data.message || `刷新冷却中：${formatCooldownDuration(retrySeconds)}后可再刷新`);
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data?.state) applyState(data.state);
    toast(data.message || buildRefreshToastMessage(data));
    const cooldownMs = Number(data.cooldownMs || data.retryInMs || 0);
    if (cooldownMs > 0) startRefreshCooldown(Math.ceil(cooldownMs / 1000));
    else setRefreshButtonState(REFRESH_LABEL_DEFAULT, false);
  } catch (error) {
    toast(`刷新失败: ${error.message || '未知错误'}`);
    setRefreshButtonState(REFRESH_LABEL_DEFAULT, false);
  } finally {
    state.refreshing = false;
  }
}

function bindRefreshControls() {
  if (!elements.refreshWall) return;
  elements.refreshWall.addEventListener('click', manuallyRefreshWall);
  const savedRemaining = readPersonalRefreshCooldownRemaining();
  if (savedRemaining > 0) startRefreshCooldown(savedRemaining, { persist: false });
}

/* ============================================================ data source */

function payloadTimestamp(payload) {
  if (!payload) return 0;
  return Number(payload.refreshedAt || 0) || Date.parse(payload.generatedAt || '') || 0;
}

function readCachedState() {
  try {
    const raw = window.sessionStorage?.getItem(STATE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.payload && Array.isArray(parsed.payload.contributors)) return parsed;
  } catch {
    // Ignore storage access errors
  }
  return null;
}

function writeCachedState(payload) {
  if (!payload || !payload.ok || !Array.isArray(payload.contributors)) return;
  try {
    window.sessionStorage?.setItem(STATE_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), mode: state.dataMode || '', payload }));
  } catch {
    // Ignore storage quota or private mode errors
  }
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
  const endpoints = dataSourceMode() === 'static'
    ? [...workerEndpoint, { url: 'contributors.json', mode: 'static' }]
    : [{ url: 'api/contributors', mode: 'api' }, ...workerEndpoint, { url: 'contributors.json', mode: 'static' }];
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
  if (state.dataMode === 'static' || state.dataMode === 'worker' || state.fallbackTimer) return;
  state.fallbackTimer = window.setInterval(async () => {
    try {
      applyState(await fetchState());
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
    if (elements.statPulse) elements.statPulse.textContent = formatRelativeTime(payload.at) || formatTime(payload.at);
  });
  source.addEventListener('error', () => {
    setConnection('offline', '连接重试中');
    startFallbackPolling();
  });
}

async function revalidateStaticAndWorkerInBackground({ checkStatic = false } = {}) {
  if (checkStatic) {
    try {
      const staticResp = await fetch('contributors.json', { priority: 'low' });
      if (staticResp.ok) {
        const staticPayload = await staticResp.json();
        if (payloadTimestamp(staticPayload) > state.lastPayloadTime) applyState(staticPayload);
      }
    } catch {
      // Ignore background static check errors
    }
  }
  const workerBase = refreshApiBase();
  if (!workerBase) return;
  try {
    const response = await fetch(`${workerBase}/api/state`, { cache: 'no-store', priority: 'low' });
    if (!response.ok) return;
    const workerPayload = await response.json();
    if (payloadTimestamp(workerPayload) >= state.lastPayloadTime || workerPayload.fingerprint !== state.lastFingerprint) {
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
    applyState(await fetchState());
    connectEvents();
  } catch {
    setConnection('offline', '数据加载失败');
  }
}


/* ================================================================== init */

function init() {
  bindAvatarFallback();
  initVfxEngine();
  const ok = initWorld();
  window.addEventListener('resize', resizeWorld);
  bindCanvasInteractions();
  bindKeyboard();
  bindHudControls();
  bindSearch();
  bindLeaderboard();
  bindCollectorCard();
  bindDialogs();
  bindRefreshControls();
  renderFeed();
  if (ok) {
    // Cinematic reveal: open on the god's-eye view of the palm, then dive into the galaxy.
    const preset = CAMERA_PRESETS.awe;
    tweenCamera(new THREE.Vector3(...preset.position), new THREE.Vector3(...preset.target), prefersReducedMotion() ? 0.6 : 8.5, null, { logZoom: true });
    if (elements.btnZoomReset) elements.btnZoomReset.textContent = `视角 · ${preset.label}`;
    window.requestAnimationFrame(renderFrame);
  }
  bootstrapState();
}

init();
