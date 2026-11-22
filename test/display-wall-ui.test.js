const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'public', 'index.html');
const APP_PATH = path.join(ROOT, 'public', 'app.js');
const STYLES_PATH = path.join(ROOT, 'public', 'styles.css');
const VENDOR_DIR = path.join(ROOT, 'public', 'vendor', 'three');

test('home page is a full-viewport 3D solar system without PR board or git history timeline', () => {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  assert.match(html, /GitHub 协作展示墙/);
  assert.match(html, /class="[^"]*pulse-dashboard[^"]*"/);
  assert.match(html, /<canvas id="galaxyCanvas"/);
  assert.match(html, /id="labelLayer"/);
  assert.match(html, /id="refreshWall"/);
  assert.match(html, /立即刷新/);
  assert.match(html, /id="honorRibbon"/);
  assert.match(html, /id="wallSearch"/);
  assert.match(html, /id="podiumViewport"/);
  assert.match(html, /<canvas id="vfxOverlay"/);
  assert.match(html, /<meta name="app-card-skins-css" content="card-skins\.css" \/>/);
  assert.match(html, /<meta name="app-vfx-engine-js" content="vfx-engine\.js" \/>/);
  assert.doesNotMatch(html, /<link rel="stylesheet" href="card-skins\.css"/);
  assert.doesNotMatch(html, /<script defer src="vfx-engine\.js"><\/script>/);
  assert.match(html, /<script type="module" src="app\.js"><\/script>/);
  assert.doesNotMatch(html, /class="brand"|id="btnConstellation"|id="toggleWallMotion"|class="camera-controls"|如何飞向恒星/);
  assert.match(html, /<dialog[^>]+id="cheersPanel"/);
  assert.match(html, /<dialog[^>]+id="activityPanel"/);
  assert.doesNotMatch(html, /PR 协作看板|Git 历史时间线|id="board"|id="history"|id="wallDrawerOverlay"/);
  assert.doesNotMatch(html, /待回答问题|热门想法|Bug 反馈/);
});

test('three.js is vendored locally and loaded through an import map', () => {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  assert.match(html, /<script type="importmap">[\s\S]*"three": "\.\/vendor\/three\/three\.module\.min\.js"/);
  assert.match(html, /<script type="module" src="app\.js"><\/script>/);
  for (const rel of [
    'three.module.min.js',
    'LICENSE',
    'addons/controls/OrbitControls.js',
    'addons/postprocessing/EffectComposer.js',
    'addons/postprocessing/UnrealBloomPass.js',
    'addons/postprocessing/OutputPass.js'
  ]) {
    assert.ok(fs.existsSync(path.join(VENDOR_DIR, rel)), `missing vendored file ${rel}`);
  }
});

test('home page links the contribution entry directly to GitHub README', () => {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  assert.doesNotMatch(html, /<nav class="topnav"/);
  assert.doesNotMatch(html, /href="guide\.html"/);
  assert.match(html, /class="[^"]*guide-entry[^"]*"/);
  assert.match(html, /href="https:\/\/github\.com\/nanzhi84\/open-source-pulse-wall#贡献步骤指南"/);
  assert.match(html, /<strong>开始贡献<\/strong>/);
  assert.match(html, /<small>README<\/small>/);
  assert.match(html, /id="openTopRepo"[\s\S]*class="[^"]*star-badge[^"]*"[\s\S]*class="guide-entry"/);
});

test('3D galaxy makes #1 the sun, puts other tiers on inclined Kepler orbits and reveals links on selection', () => {
  const script = fs.readFileSync(APP_PATH, 'utf8');

  assert.match(script, /import \* as THREE from 'three';/);
  assert.match(script, /const ORBITS = \[/);
  assert.match(script, /incl: -?0\.\d+, node: \d/);
  assert.match(script, /if \(score\?\.isTop5 && Number\(score\.rank\) === 1\) return 'sun';/);
  assert.match(script, /function setSunChampion\(/);
  assert.match(script, /KEPLER_K \/ Math\.max\(120, r\) \*\* 1\.5/);
  assert.match(script, /const STAR_THEMES = \[/);
  assert.match(script, /const STAR_RING_STYLES = \[/);
  assert.match(script, /const STAR_MOONS = \[/);
  assert.match(script, /const STAR_BADGES = \[/);
  assert.match(script, /assignStarRecipes/);
  assert.match(script, /renderHonorRibbon/);
  assert.match(script, /focusPlanetByKey/);
  assert.match(script, /const VISIBLE_FEED_ITEMS = 3;/);
  assert.match(script, /data-cheers-trigger=/);
  assert.match(script, /const list = focusKey \? \(scene\.linksByKey\.get\(focusKey\) \|\| \[\]\) : \(scene\.constellation \? scene\.links : \[\]\);/);
  assert.match(script, /new UnrealBloomPass\(/);
  assert.match(script, /prefersReducedMotion\(\)/);
});

test('planet cards unlock top-tier collector skins and 16 frame-break VFX directly on Star without neighbor links', () => {
  const script = fs.readFileSync(APP_PATH, 'utf8');
  const skins = fs.readFileSync(path.join(ROOT, 'public', 'card-skins.css'), 'utf8');
  const engine = fs.readFileSync(path.join(ROOT, 'public', 'vfx-engine.js'), 'utf8');
  const showcaseHtml = fs.readFileSync(path.join(ROOT, 'public', 'vfx-showcase.html'), 'utf8');

  assert.match(script, /const STAR_VFX = \[/);
  assert.doesNotMatch(script, /STAR_VFX_BY_TIER/);
  assert.match(script, /const STAR_SPECTRA = \[/);
  assert.match(script, /const STAR_PATTERNS = \[/);
  assert.match(script, /function starPatternSvg\(/);
  assert.match(script, /function starBadgeSvg\(/);
  assert.match(script, /function collectorCardMarkup\(/);
  assert.match(script, /data-star-vfx-tier="\$\{recipe\.vfxTier\}"/);
  assert.match(script, /function ensureCardSkinsCss\(/);
  assert.match(script, /function ensureVfxEngine\(/);
  assert.match(script, /new window\.PulseWallVfxEngine\(/);
  assert.match(script, /vfxEngine\.focusTriggerCard\(/);
  assert.match(script, /function leaderboardOrder\(/);
  assert.match(script, /未点 Star/);
  for (const id of [
    'vermilion-phoenix',
    'celestial-butterfly',
    'chrono-clockwork',
    'raging-tsunami',
    'meteor-shower',
    'glacial-freeze',
    'shadow-eminence'
  ]) {
    assert.match(script, new RegExp(`id:\\s*'${id}'`), `app.js missing ${id}`);
    assert.match(engine, new RegExp(`id:\\s*'${id}'`), `vfx-engine.js missing ${id}`);
  }
  for (const deprecated of ['ink-dragon', 'nine-tail-fox', 'frost-fenrir']) {
    assert.doesNotMatch(engine, new RegExp(`id:\\s*'${deprecated}'`), `vfx-engine.js still defines ${deprecated}`);
  }
  assert.doesNotMatch(engine, /getNeighborCards|triggerNeighborImpact/);
  assert.doesNotMatch(skins, /is-vfx-neighbor-hit|cardNeighborHitRecoil/);
  assert.doesNotMatch(showcaseHtml, /tier-switcher/);
  assert.match(showcaseHtml, /<span class="tab-count">16<\/span>/);
  assert.match(skins, /\.collector-slot \.profile-card\.is-starred/);
  assert.doesNotMatch(skins.replace(/\/\*[\s\S]*?\*\//g, ''), /^\.(?!collector-slot)[a-z]/m);
});

test('HUD floats on space without nested card boxes and respects reduced motion', () => {
  const styles = fs.readFileSync(STYLES_PATH, 'utf8');

  assert.match(styles, /\.galaxy-stage\s*\{[\s\S]*width:\s*100vw;[\s\S]*height:\s*100vh;/);
  assert.match(styles, /\.scrim-left/);
  assert.match(styles, /\.podium-list li \{ border-top: 1px solid var\(--hair\); \}/);
  assert.match(styles, /\.podium-viewport\.is-looping/);
  assert.doesNotMatch(styles, /@property --orbit-angle/);
  assert.match(styles, /@keyframes orbit-sweep\s*\{\s*to\s*\{\s*transform:\s*rotate\(360deg\);\s*\}\s*\}/);
  assert.match(styles, /\.champion-label/);
  assert.match(styles, /\.orbit-label/);
  assert.match(styles, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(styles, /dialog::backdrop|\.sheet-dialog::backdrop/);
});

test('3D galaxy uses 5-orbit rank-percentile tiering and expanded deep-space scale', () => {
  const vm = require('node:vm');
  const script = fs.readFileSync(APP_PATH, 'utf8');
  const styles = fs.readFileSync(STYLES_PATH, 'utf8');
  const scoreEngine = require(path.join(ROOT, 'scripts', 'score-engine.js'));

  assert.match(script, /import \{ buildAbyss \} from '\.\/abyss\.js';/);
  const abyssPath = path.join(ROOT, 'public', 'abyss.js');
  assert.ok(fs.existsSync(abyssPath), 'missing public/abyss.js');
  const abyssSrc = fs.readFileSync(abyssPath, 'utf8');
  assert.match(abyssSrc, /export function buildAbyss\(/);
  assert.match(abyssSrc, /gl_PointCoord/);
  assert.doesNotMatch(abyssSrc, /PointsMaterial/);
  assert.match(abyssSrc, /SphereGeometry/);
  assert.match(abyssSrc, /'colossus'/);
  assert.match(abyssSrc, /'colossus-ring'/);
  assert.match(abyssSrc, /DISTANT_GALAXIES/);
  assert.doesNotMatch(script, /function collectorTierCaption\(body\)[\s\S]*?return `顶格专属 ·/);
  const buildSunStart = script.indexOf('function buildSun(');
  const setSunChampStart = script.indexOf('function setSunChampion(');
  assert.ok(buildSunStart >= 0 && setSunChampStart > buildSunStart);
  assert.match(script.slice(buildSunStart, setSunChampStart), /new THREE\.PointsMaterial\(\{[\s\S]*?map:\s*canvasTexture\(/);
  assert.match(script, /const PRESET_ORDER = \['awe', 'overview', 'flyby'\];/);
  assert.match(script, /gaze:\s*\{/);
  assert.match(script, /followReleaseDist/);
  assert.match(script, /nav\.recentering/);
  assert.match(script, /const STATE_CACHE_KEY = 'pulse-wall:state:v6';/);
  assert.match(script, /const TIER_PERCENTILE_CUTOFFS = \{ tier3: 0\.15, tier2: 0\.5 \};/);
  assert.match(script, /const SUN_RADIUS = 1700;/);
  assert.match(script, /const KEPLER_K = 36000;/);
  assert.match(script, /const TOP5_SIZE = \{ 2: 615, 3: 575, 4: 535, 5: 495 \};/);
  assert.match(script, /const PLANET_SIZE_RANGE = \{ tier3: \[285, 355\], tier2: \[165, 215\], tier1: \[84, 114\], outer: \[30, 46\] \};/);
  assert.match(script, /incl: 0\.12[\s\S]*incl: 0\.34[\s\S]*incl: -0\.24[\s\S]*incl: 0\.42[\s\S]*incl: 0\.07/);
  assert.match(script, /style:\s*0[\s\S]*style:\s*1[\s\S]*style:\s*2[\s\S]*style:\s*3[\s\S]*style:\s*4/);
  assert.match(script, /lockedKey:\s*null/);
  assert.match(script, /function lockPlanet\(/);
  assert.match(script, /function closePlanetCard\(\{ keepFollow = true, keepLock = true/);
  assert.match(script, /function unlockPlanet\(/);
  const cycleStart = script.indexOf('function cyclePreset(');
  const dollyStart = script.indexOf('function dollyBy(');
  assert.ok(cycleStart >= 0 && dollyStart > cycleStart);
  assert.match(script.slice(cycleStart, dollyStart), /applyPreset\(next\)/);
  assert.doesNotMatch(script.slice(cycleStart, dollyStart), /lockedKey\s*=\s*null/);
  const ribbonStart = script.indexOf('function renderHonorRibbon(');
  const vfxInitStart = script.indexOf('function initVfxEngine(');
  assert.ok(ribbonStart >= 0 && vfxInitStart > ribbonStart);
  const ribbonSlice = script.slice(ribbonStart, vfxInitStart);
  assert.doesNotMatch(ribbonSlice, /\.inert\s*=\s*true/);
  assert.match(ribbonSlice, /tabIndex\s*=\s*-1/);
  const orbitFnStart = script.indexOf('function orbitSheetMaterial(');
  const buildOrbitsStart = script.indexOf('function buildOrbits(');
  assert.ok(orbitFnStart >= 0 && buildOrbitsStart > orbitFnStart);
  const orbitMatSlice = script.slice(orbitFnStart, buildOrbitsStart);
  assert.match(orbitMatSlice, /pxWorld/);
  assert.doesNotMatch(orbitMatSlice, /cos\(ang/);
  assert.match(script, /new THREE\.PerspectiveCamera\([\s\S]*0\.6,\s*750000\)/);
  assert.match(script, /new UnrealBloomPass\([\s\S]*0\.46,\s*0\.42,\s*0\.92\)/);
  assert.match(script, /sun\.glow\.scale\.setScalar\(SUN_RADIUS \* 4\.0/);
  assert.match(script, /const sig = `\$\{planet\.orbitId\}\|/);
  assert.match(script, /function terrestrialCanvas\(/);
  assert.match(script, /function iceGiantCanvas\(/);
  assert.match(script, /function makeContributorRockMaterial\(/);
  assert.match(script, /function planetRingMaterial\(/);
  assert.match(script, /function planetBackAtmosphereMaterial\(/);
  const ensureFnStart = script.indexOf('function ensurePlanetObject(');
  const disposeFnStart = script.indexOf('function disposePlanetObject(');
  const linkStart = script.indexOf('/* ----------------------------------------------------------------- links */');
  assert.ok(ensureFnStart >= 0 && disposeFnStart > ensureFnStart && linkStart > disposeFnStart);
  assert.doesNotMatch(script.slice(ensureFnStart, disposeFnStart), /SHOCK_GEO|let trail\b|\btrail\b/);
  assert.doesNotMatch(script.slice(disposeFnStart, linkStart), /obj\.trail/);

  const linkLayerStart = script.indexOf('function buildLinkLayer(');
  const addEffectStart = script.indexOf('function addEffect(');
  assert.ok(linkLayerStart >= 0 && addEffectStart > linkLayerStart);
  const linkSlice = script.slice(linkLayerStart, addEffectStart);
  assert.doesNotMatch(linkSlice, /new THREE\.Points/);
  assert.match(linkSlice, /world\.textures\.spark\s*=\s*sparkTex/);

  // Confirm 5-orbit system without legacy star-orbit / 0-tier / fixed threshold artifacts or recipe-line
  assert.doesNotMatch(script, /0阶|star-card|resolveTierMeta|TIER_FLOORS|PLANET_BASE_SIZE|VFX_TIER_THRESHOLDS/);
  assert.doesNotMatch(script, /recipe-line/);
  assert.doesNotMatch(styles, /\.recipe-line|\.recipe-badge/);
  assert.doesNotMatch(script, /\{ id: 'star',/);
  assert.match(script, /\{ id: 'top5', r: 6200,/);
  assert.match(script, /\{ id: 'tier3', r: 9400,/);
  assert.match(script, /\{ id: 'tier2', r: 13600,/);
  assert.match(script, /\{ id: 'tier1', r: 18800,/);
  assert.match(script, /\{ id: 'outer', r: 25600,[\s\S]*belt: 2800 \}/);

  // Verify runtime parity of frontend computeTierCutoffs, resolveRankTier, and buildPromotionInfo against score-engine.js
  const tierFnStart = script.indexOf('function computeTierCutoffs(');
  const tierFnEnd = script.indexOf('function buildFallbackScoresMap(');
  assert.ok(tierFnStart >= 0 && tierFnEnd > tierFnStart, 'expected rank-percentile helpers in app.js');
  const excerpt = `
    const TOP5_LIMIT = 5;
    const TOP5_MIN_POINTS = 1;
    const TIER_PERCENTILE_CUTOFFS = { tier3: 0.15, tier2: 0.5 };
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    ${script.slice(tierFnStart, tierFnEnd)}
    this.__exports = { computeTierCutoffs, resolveRankTier, buildPromotionInfo };
  `;
  const sandbox = {};
  vm.runInNewContext(excerpt, sandbox);

  const sameRealm = (value) => JSON.parse(JSON.stringify(value));

  for (const poolSize of [0, 1, 2, 3, 10, 44]) {
    assert.deepEqual(
      sameRealm(sandbox.__exports.computeTierCutoffs(poolSize)),
      scoreEngine.computeTierCutoffs(poolSize),
      `cutoff parity mismatch for poolSize=${poolSize}`
    );
  }
  for (const [starred, rank, starredCount] of [
    [false, 4, 10],
    [true, 1, 49],
    [true, 3, 49],
    [true, 6, 49],
    [true, 12, 49],
    [true, 13, 49],
    [true, 27, 49],
    [true, 28, 49],
    [true, 49, 49],
    [true, 6, 6],
    [true, 6, 7],
    [true, 7, 7]
  ]) {
    assert.deepEqual(
      sameRealm(sandbox.__exports.resolveRankTier({ starred, rank, starredCount })),
      scoreEngine.resolveRankTier({ starred, rank, starredCount }),
      `resolveRankTier parity mismatch for starred=${starred}, rank=${rank}, starredCount=${starredCount}`
    );
  }

  // Verify promotion parity on a realistic multi-tier cohort
  const contributors = Array.from({ length: 12 }, (_, i) => ({
    name: `User ${i + 1}`,
    github: `user${i + 1}`,
    starred: i < 10,
    joinedAt: `2026-11-01T00:${String(i).padStart(2, '0')}:00Z`,
    cheers: i < 10 ? Array.from({ length: (10 - i) % 4 }, (__, j) => ({ from: `user${((i + j + 1) % 10) + 1}`, message: 'nice!' })) : []
  }));
  const engineScored = scoreEngine.computeContributorScores({ contributors }).contributors
    .slice()
    .sort((a, b) => a.score.rank - b.score.rank);
  const rankedStarred = engineScored
    .filter((c) => c.score.starred)
    .map((c) => ({ points: c.score.points }));
  const cutoffs = sandbox.__exports.computeTierCutoffs(Math.max(0, rankedStarred.length - 5));
  for (const c of engineScored) {
    const promo = sameRealm(sandbox.__exports.buildPromotionInfo({
      starred: c.score.starred,
      points: c.score.points,
      rank: c.score.rank,
      orbitId: c.score.orbitId,
      starredCount: rankedStarred.length,
      rankedStarred,
      cutoffs
    }));
    assert.deepEqual(promo, c.score.promotion, `promotion parity mismatch for ${c.github}`);
  }
});
