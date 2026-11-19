#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { loadEnvFile } = require('./load-env');

loadEnvFile(path.resolve(__dirname, '..'));
const {
  fetchGithubState,
  buildContributorState,
  resolveGithubRepository
} = require('./state-builder');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');
const GITHUB_TOKEN = String(process.env.GITHUB_TOKEN || '').trim();

function assertBuildConfig(repository) {
  if (!repository) {
    throw new Error(
      'Could not resolve GitHub repository. Set GITHUB_REPOSITORY, add data/github-sync.json with ' +
      '"repository": "owner/repo", set package.json#repository, or build from a git clone whose ' +
      'origin points at github.com.'
    );
  }
}

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function shortFileHash(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 10);
}

function markStaticHtmlAssets() {
  const cssHash = shortFileHash(path.join(DIST_DIR, 'styles.css'));
  const jsHash = shortFileHash(path.join(DIST_DIR, 'app.js'));

  for (const htmlFile of ['index.html', 'guide.html']) {
    const htmlPath = path.join(DIST_DIR, htmlFile);
    if (!fs.existsSync(htmlPath)) continue;

    let html = fs.readFileSync(htmlPath, 'utf8');
    const preloadDataHint = htmlFile === 'index.html'
      ? '\n  <link rel="preload" href="contributors.json" as="fetch" crossorigin />'
      : '';
    html = html
      .replace(
        '<meta name="app-data-source" content="auto" />',
        `<meta name="app-data-source" content="static" />${preloadDataHint}`
      )
      .replace('href="styles.css"', `href="styles.css?v=${cssHash}"`)
      .replace('src="app.js"', `src="app.js?v=${jsHash}"`)
      .replace(/src="(guide-assets\/[^"?]+\.png)"/g, (_, relPath) => {
        const assetFull = path.join(DIST_DIR, relPath);
        return fs.existsSync(assetFull) ? `src="${relPath}?v=${shortFileHash(assetFull)}"` : `src="${relPath}"`;
      });

    fs.writeFileSync(htmlPath, html);
  }
}

async function buildStaticSite() {
  const repository = resolveGithubRepository(ROOT);
  assertBuildConfig(repository);

  const githubState = await fetchGithubState({
    repository,
    token: GITHUB_TOKEN
  });
  const payload = buildContributorState({ githubState });

  if (!payload.ok) {
    throw new Error(`Contributor validation failed:\n${payload.errors.join('\n')}`);
  }

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  copyDirectory(PUBLIC_DIR, DIST_DIR);
  markStaticHtmlAssets();
  fs.writeFileSync(
    path.join(DIST_DIR, 'contributors.json'),
    JSON.stringify({
      ...payload,
      delivery: 'github-pages'
    })
  );

  console.log(`Built GitHub Pages site for ${githubState.repository}`);
  console.log(`Output: ${DIST_DIR}`);
  console.log(`Profiles: ${payload.contributors.length}`);
}

buildStaticSite().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
