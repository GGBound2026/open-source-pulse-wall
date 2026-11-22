#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { loadEnvFile, resolveGithubToken } = require('./load-env');

loadEnvFile(path.resolve(__dirname, '..'));
const {
  fetchGithubState,
  buildContributorState,
  resolveGithubRepository
} = require('./state-builder');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');
const GITHUB_TOKEN = resolveGithubToken();

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

function loadEsbuild() {
  try {
    return require('esbuild');
  } catch {
    return null;
  }
}

async function optimizeStaticAssets() {
  const esbuild = loadEsbuild();
  if (!esbuild) {
    return { bundledApp: false, minified: false };
  }

  const addonsDir = path.join(PUBLIC_DIR, 'vendor', 'three', 'addons');
  await esbuild.build({
    entryPoints: [path.join(PUBLIC_DIR, 'app.js')],
    outfile: path.join(DIST_DIR, 'app.js'),
    bundle: true,
    format: 'esm',
    minify: true,
    target: ['es2022'],
    legalComments: 'none',
    plugins: [
      {
        name: 'resolve-three-vendor',
        setup(build) {
          build.onResolve({ filter: /^three$/ }, () => ({
            path: 'three',
            external: true
          }));
          build.onResolve({ filter: /^three\/addons\/(.+)$/ }, (args) => ({
            path: path.join(addonsDir, args.path.slice('three/addons/'.length))
          }));
        }
      }
    ]
  });

  // Remove files already bundled into dist/app.js
  fs.rmSync(path.join(DIST_DIR, 'abyss.js'), { force: true });
  fs.rmSync(path.join(DIST_DIR, 'vendor', 'three', 'addons'), { recursive: true, force: true });

  for (const jsFile of ['vfx-engine.js', 'vfx-showcase.js']) {
    const filePath = path.join(DIST_DIR, jsFile);
    if (!fs.existsSync(filePath)) continue;
    const result = esbuild.transformSync(fs.readFileSync(filePath, 'utf8'), {
      loader: 'js',
      sourcefile: jsFile,
      minify: true,
      target: 'es2022',
      legalComments: 'none'
    });
    fs.writeFileSync(filePath, result.code);
  }

  for (const cssFile of ['styles.css', 'card-skins.css', 'vfx-cards.css', 'vfx-showcase.css']) {
    const filePath = path.join(DIST_DIR, cssFile);
    if (!fs.existsSync(filePath)) continue;
    const result = esbuild.transformSync(fs.readFileSync(filePath, 'utf8'), {
      loader: 'css',
      sourcefile: cssFile,
      minify: true,
      legalComments: 'none'
    });
    fs.writeFileSync(filePath, result.code);
  }

  return { bundledApp: true, minified: true };
}

function markStaticHtmlAssets({ bundledApp = false } = {}) {
  const abyssJsPath = path.join(DIST_DIR, 'abyss.js');
  const appJsPath = path.join(DIST_DIR, 'app.js');
  let abyssHash = '';
  if (!bundledApp && fs.existsSync(abyssJsPath) && fs.existsSync(appJsPath)) {
    abyssHash = shortFileHash(abyssJsPath);
    const appJs = fs.readFileSync(appJsPath, 'utf8');
    fs.writeFileSync(
      appJsPath,
      appJs.replace(/from\s+['"]\.\/abyss\.js['"]/, `from './abyss.js?v=${abyssHash}'`)
    );
  }

  const cssHash = shortFileHash(path.join(DIST_DIR, 'styles.css'));
  const vfxHash = shortFileHash(path.join(DIST_DIR, 'vfx-engine.js'));
  const jsHash = shortFileHash(appJsPath);
  const showcaseCssPath = path.join(DIST_DIR, 'vfx-showcase.css');
  const showcaseJsPath = path.join(DIST_DIR, 'vfx-showcase.js');
  const cardsCssPath = path.join(DIST_DIR, 'vfx-cards.css');
  const showcaseCssHash = fs.existsSync(showcaseCssPath) ? shortFileHash(showcaseCssPath) : '';
  const showcaseJsHash = fs.existsSync(showcaseJsPath) ? shortFileHash(showcaseJsPath) : '';
  const cardsCssHash = fs.existsSync(cardsCssPath) ? shortFileHash(cardsCssPath) : '';
  const skinsCssPath = path.join(DIST_DIR, 'card-skins.css');
  const skinsCssHash = fs.existsSync(skinsCssPath) ? shortFileHash(skinsCssPath) : '';

  for (const htmlFile of ['index.html', 'vfx-showcase.html']) {
    const htmlPath = path.join(DIST_DIR, htmlFile);
    if (!fs.existsSync(htmlPath)) continue;

    let html = fs.readFileSync(htmlPath, 'utf8');
    const preloadDataHint = '\n  <link rel="preload" href="contributors.json" as="fetch" crossorigin />';
    html = html
      .replace(
        '<meta name="app-data-source" content="auto" />',
        `<meta name="app-data-source" content="static" />${preloadDataHint}`
      )
      .replace('href="styles.css"', `href="styles.css?v=${cssHash}"`)
      .replace('src="vfx-engine.js"', `src="vfx-engine.js?v=${vfxHash}"`)
      .replace('content="vfx-engine.js"', `content="vfx-engine.js?v=${vfxHash}"`)
      .replace('href="app.js"', `href="app.js?v=${jsHash}"`)
      .replace('src="app.js"', `src="app.js?v=${jsHash}"`);

    if (bundledApp) {
      html = html
        .replace(/^\s*<link rel="modulepreload" href="abyss\.js" \/>\r?\n/gm, '')
        .replace(/^\s*<link rel="modulepreload" href="vendor\/three\/addons\/[^"]+" \/>\r?\n/gm, '');
    } else if (abyssHash) {
      html = html.replace('href="abyss.js"', `href="abyss.js?v=${abyssHash}"`);
    }

    if (showcaseCssHash) {
      html = html.replace('href="vfx-showcase.css"', `href="vfx-showcase.css?v=${showcaseCssHash}"`);
    }
    if (skinsCssHash) {
      html = html
        .replace('href="card-skins.css"', `href="card-skins.css?v=${skinsCssHash}"`)
        .replace('content="card-skins.css"', `content="card-skins.css?v=${skinsCssHash}"`);
    }
    if (cardsCssHash) {
      html = html.replace('href="vfx-cards.css"', `href="vfx-cards.css?v=${cardsCssHash}"`);
    }
    if (showcaseJsHash) {
      html = html.replace('src="vfx-showcase.js"', `src="vfx-showcase.js?v=${showcaseJsHash}"`);
    }

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
  const assetOpt = await optimizeStaticAssets();
  markStaticHtmlAssets(assetOpt);
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
  console.log(`Assets: ${assetOpt.bundledApp ? 'bundled & minified (esbuild)' : 'unbundled fallback'}`);
}

buildStaticSite().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
