const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'public', 'index.html');
const APP_PATH = path.join(ROOT, 'public', 'app.js');
const STYLES_PATH = path.join(ROOT, 'public', 'styles.css');

test('home page is a full-width contributor hall without PR board or git history timeline', () => {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  assert.match(html, /GitHub 协作展示墙/);
  assert.match(html, /class="[^"]*pulse-dashboard[^"]*"/);
  assert.match(html, /class="[^"]*dashboard-main[^"]*"/);
  assert.match(html, /id="refreshWall"/);
  assert.match(html, /立即刷新/);
  assert.match(html, /data-wall-filter="starred"/);
  assert.match(html, /data-wall-filter="cheers"/);
  assert.match(html, /id="toggleWallMotion"/);
  assert.doesNotMatch(html, /PR 协作看板|Git 历史时间线|id="board"|id="history"|id="wallDrawerOverlay"/);
  assert.doesNotMatch(html, /待回答问题|热门想法|Bug 反馈/);
});

test('home page links the contribution entry directly to GitHub README', () => {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');

  assert.doesNotMatch(html, /<nav class="topnav"/);
  assert.doesNotMatch(html, /href="guide\.html"/);
  assert.match(html, /class="[^"]*guide-entry[^"]*"/);
  assert.match(html, /href="https:\/\/github\.com\/nanzhi84\/open-source-pulse-wall#贡献步骤指南"/);
  assert.match(html, /<strong>开始贡献<\/strong>/);
  assert.match(html, /<small>README<\/small>/);
  assert.match(html, /class="guide-entry"[\s\S]*id="openTopRepo"[\s\S]*class="star-badge"/);
});

test('contributor wall renders all contributors with inline peer cheers and combinable star effects', () => {
  const script = fs.readFileSync(APP_PATH, 'utf8');
  const styles = fs.readFileSync(STYLES_PATH, 'utf8');

  assert.doesNotMatch(script, /WALL_PREVIEW_LIMIT/);
  assert.match(script, /const VISIBLE_FEED_ITEMS = 3;/);
  assert.match(script, /cheersMarkup\(profile\)/);
  assert.match(script, /data-cheers-trigger=/);
  assert.match(script, /const STAR_THEMES = \[/);
  assert.match(script, /const STAR_FRAMES = \[/);
  assert.match(script, /const STAR_AURAS = \[/);
  assert.match(script, /const STAR_PATTERNS = \[/);
  assert.match(script, /const STAR_BADGES = \[/);
  assert.match(script, /assignStarRecipes/);
  assert.match(styles, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: no-preference\)/);
});
