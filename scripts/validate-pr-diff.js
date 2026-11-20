#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_MAINTAINERS = ['nanzhi84', 'YJLEC'];

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function parseMaintainers(raw) {
  if (!raw) return [...DEFAULT_MAINTAINERS];
  const parsed = String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : [...DEFAULT_MAINTAINERS];
}

function parseNameStatusZ(raw) {
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '');
  if (!text) return [];

  const tokens = text.split('\0');
  const changes = [];

  for (let i = 0; i < tokens.length; ) {
    const statusToken = tokens[i];
    if (!statusToken) {
      i += 1;
      continue;
    }

    const code = statusToken[0];
    if (code === 'R' || code === 'C') {
      const previousPath = tokens[i + 1] || '';
      const nextPath = tokens[i + 2] || '';
      if (previousPath && nextPath) {
        changes.push({
          status: code,
          previousPath: normalizePath(previousPath),
          path: normalizePath(nextPath)
        });
      }
      i += 3;
      continue;
    }

    const filePath = tokens[i + 1] || '';
    if (filePath) {
      changes.push({
        status: code,
        path: normalizePath(filePath)
      });
    }
    i += 2;
  }

  return changes;
}

function expandChangeOperations(changedFiles) {
  const ops = [];
  for (const item of changedFiles) {
    const status = String(item?.status || '').trim().toUpperCase();
    const filePath = normalizePath(item?.path);
    const previousPath = normalizePath(item?.previousPath);

    if (status.startsWith('R')) {
      if (previousPath) ops.push({ status: 'D', path: previousPath });
      if (filePath) ops.push({ status: 'A', path: filePath });
    } else if (status.startsWith('C')) {
      if (filePath) ops.push({ status: 'A', path: filePath });
    } else if (filePath) {
      ops.push({ status: status[0] || 'M', path: filePath });
    }
  }
  return ops;
}

function validatePrDiff({ prAuthor, changedFiles = [], maintainers = DEFAULT_MAINTAINERS } = {}) {
  const author = String(prAuthor || '').trim();
  const errors = [];

  if (!author) {
    return {
      ok: false,
      skipped: false,
      errors: ['无法识别 PR 提交者用户名（PR_AUTHOR 为空）']
    };
  }

  const authorLower = author.toLowerCase();
  const maintainerSet = new Set(
    (Array.isArray(maintainers) ? maintainers : DEFAULT_MAINTAINERS)
      .map((name) => String(name || '').trim().toLowerCase())
      .filter(Boolean)
  );

  if (maintainerSet.has(authorLower)) {
    return {
      ok: true,
      skipped: true,
      errors: []
    };
  }

  const ops = expandChangeOperations(changedFiles);
  if (ops.length === 0) {
    return {
      ok: false,
      skipped: false,
      errors: ['PR 未包含任何文件变更']
    };
  }

  const seenProfilePaths = new Map();
  const seenCheerPaths = new Map();

  for (const op of ops) {
    const filePath = op.path;

    if (!filePath.startsWith('data/profiles/') && !filePath.startsWith('data/cheers/')) {
      errors.push(
        `${filePath}: 普通 PR 仅允许修改 data/profiles/ 和 data/cheers/ 下的贡献者数据文件`
      );
      continue;
    }

    if (filePath === 'data/profiles/_template.json' || filePath === 'data/cheers/_template.json') {
      errors.push(`${filePath}: 不能修改模板文件，请复制模板后再创建你的文件`);
      continue;
    }

    if (op.status === 'D') {
      errors.push(`${filePath}: 普通 PR 不允许删除文件`);
      continue;
    }

    if (filePath.startsWith('data/profiles/')) {
      const rest = filePath.slice('data/profiles/'.length);
      if (rest.includes('/')) {
        errors.push(`${filePath}: 不允许在 data/profiles/ 下创建子目录`);
        continue;
      }

      if (!rest.endsWith('.json') || rest.startsWith('_')) {
        errors.push(`${filePath}: 个人卡片必须是 data/profiles/${author}.json`);
        continue;
      }

      const stem = rest.slice(0, -'.json'.length);
      if (stem.toLowerCase() !== authorLower) {
        errors.push(
          `${filePath}: 你只能新增或修改自己的个人卡片（data/profiles/${author}.json），不能修改他人的卡片`
        );
        continue;
      }

      const profileKey = stem.toLowerCase();
      const prevProfilePath = seenProfilePaths.get(profileKey);
      if (prevProfilePath && prevProfilePath !== filePath) {
        errors.push(`${filePath}: 与本 PR 中的 ${prevProfilePath} 文件名重复（不区分大小写），请只保留一个`);
      } else {
        seenProfilePaths.set(profileKey, filePath);
      }
      continue;
    }

    if (filePath.startsWith('data/cheers/')) {
      const rest = filePath.slice('data/cheers/'.length);
      const segments = rest.split('/');

      if (segments.length !== 2) {
        errors.push(
          `${filePath}: 寄语文件路径必须为 data/cheers/<目标用户名小写>/<你的GitHub用户名>.json`
        );
        continue;
      }

      const [target, filename] = segments;
      if (!target || target.startsWith('_') || !filename || filename.startsWith('_') || !filename.endsWith('.json')) {
        errors.push(
          `${filePath}: 寄语文件路径必须为 data/cheers/<目标用户名小写>/<你的GitHub用户名>.json（且不能以 "_" 开头）`
        );
        continue;
      }

      if (target.toLowerCase() === authorLower) {
        errors.push(`${filePath}: 不能给自己写寄语，请把寄语放到其他同学的目录下`);
        continue;
      }

      if (target !== target.toLowerCase()) {
        errors.push(
          `${filePath}: 寄语目标目录名必须使用全小写（请改为 data/cheers/${target.toLowerCase()}/${author}.json）`
        );
      }

      const fileStem = filename.slice(0, -'.json'.length);
      if (fileStem.toLowerCase() !== authorLower) {
        if (op.status === 'M') {
          errors.push(
            `${filePath}: 不能修改他人已有的寄语文件，请新建或修改你自己的寄语文件（data/cheers/${target.toLowerCase()}/${author}.json）`
          );
        } else {
          errors.push(
            `${filePath}: 寄语文件名必须使用你自己的 GitHub 用户名（请改为 data/cheers/${target.toLowerCase()}/${author}.json）`
          );
        }
        continue;
      }

      const cheerKey = `${target.toLowerCase()}/${fileStem.toLowerCase()}`;
      const prevCheerPath = seenCheerPaths.get(cheerKey);
      if (prevCheerPath && prevCheerPath !== filePath) {
        errors.push(`${filePath}: 与本 PR 中的 ${prevCheerPath} 文件路径重复（不区分大小写），请只保留一个`);
      } else {
        seenCheerPaths.set(cheerKey, filePath);
      }
    }
  }

  return {
    ok: errors.length === 0,
    skipped: false,
    errors
  };
}

function isMergeCommit(ref, cwd) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^2`], {
      cwd,
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

function readGitChangedFiles({ baseSha, headSha = 'HEAD', cwd = ROOT } = {}) {
  // On GitHub pull_request events, checkout points at the synthetic merge commit
  // refs/pull/<n>/merge where HEAD^1 is current base (main) and HEAD^2 is PR head.
  // Diffing HEAD^1..HEAD avoids polluting the PR diff with commits merged into main
  // after PR_BASE_SHA was recorded.
  const diffRange = isMergeCommit(headSha, cwd)
    ? [`${headSha}^1`, headSha]
    : (() => {
        if (!baseSha) {
          throw new Error('缺少 PR_BASE_SHA，无法计算 PR 变更范围');
        }
        return [`${baseSha}...${headSha}`];
      })();

  const output = execFileSync(
    'git',
    ['diff', '--name-status', '-z', ...diffRange],
    {
      cwd,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    }
  );

  return parseNameStatusZ(output);
}

if (require.main === module) {
  const prAuthor = process.env.PR_AUTHOR || '';
  const baseSha = process.env.PR_BASE_SHA || '';
  const headSha = process.env.PR_HEAD_SHA || 'HEAD';
  const maintainers = parseMaintainers(process.env.PR_MAINTAINERS);

  const maintainerSet = new Set(maintainers.map((item) => item.toLowerCase()));
  if (prAuthor && maintainerSet.has(prAuthor.trim().toLowerCase())) {
    console.log(`PR diff check skipped for maintainer @${prAuthor}.`);
    process.exit(0);
  }

  let changedFiles;
  try {
    changedFiles = readGitChangedFiles({ baseSha, headSha });
  } catch (error) {
    console.error(`PR diff check failed: ${error.message}`);
    process.exit(1);
  }

  const result = validatePrDiff({ prAuthor, changedFiles, maintainers });

  console.log('\nOpen Source Pulse Wall PR diff validation');
  console.log(`PR Author: @${prAuthor}`);
  console.log(`Changed files: ${changedFiles.length}`);

  if (!result.ok) {
    console.log('\nErrors:');
    result.errors.forEach((error) => console.log(`  ✗ ${error}`));
    console.log('\nPR diff validation failed.\n');
    process.exit(1);
  }

  console.log('\nPR diff validation passed.\n');
}

module.exports = {
  DEFAULT_MAINTAINERS,
  parseMaintainers,
  parseNameStatusZ,
  validatePrDiff,
  readGitChangedFiles
};
