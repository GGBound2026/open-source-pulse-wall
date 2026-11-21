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
  assert.match(html, /<link rel="stylesheet" href="card-skins\.css" \/>/);
  assert.match(html, /<script defer src="vfx-engine\.js"><\/script>[\s\S]*<script type="module" src="app\.js">/);
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
  assert.match(styles, /@property --orbit-angle/);
  assert.match(styles, /\.champion-label/);
  assert.match(styles, /\.orbit-label/);
  assert.match(styles, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(styles, /dialog::backdrop|\.sheet-dialog::backdrop/);
});
