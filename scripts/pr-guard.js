#!/usr/bin/env node

const {
  listProfileFiles,
  listCheerFiles,
  validateProfile,
  validateCheerEntry,
  validateGithubHandle,
  validateJsonFormatting,
  CHEERS_MAX_PER_PROFILE
} = require('./validate-contributors');
const {
  DEFAULT_MAINTAINERS,
  parseMaintainers,
  validatePrDiff
} = require('./validate-pr-diff');

const COMMENT_MARKER = '<!-- open-source-pulse-wall:pr-guard -->';

function mapGithubStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'added':
      return 'A';
    case 'modified':
    case 'changed':
      return 'M';
    case 'removed':
      return 'D';
    case 'renamed':
      return 'R';
    case 'copied':
      return 'C';
    default:
      return 'M';
  }
}

function normalizeGithubPrFiles(apiFiles = []) {
  return apiFiles.map((file) => {
    const mapped = {
      status: mapGithubStatus(file.status),
      path: String(file.filename || '').replace(/\\/g, '/').replace(/^\/+/, ''),
      sha: String(file.sha || '')
    };
    if (file.previous_filename) {
      mapped.previousPath = String(file.previous_filename).replace(/\\/g, '/').replace(/^\/+/, '');
    }
    return mapped;
  });
}

function evaluatePrGuard({
  prAuthor,
  changedFiles = [],
  fileContents = {},
  existingProfileFiles = [],
  existingCheerFiles = [],
  maintainers = DEFAULT_MAINTAINERS
} = {}) {
  const diffResult = validatePrDiff({ prAuthor, changedFiles, maintainers });

  if (diffResult.skipped) {
    return {
      ok: true,
      skipped: true,
      prAuthor: String(prAuthor || '').trim(),
      pathErrors: [],
      contentErrors: [],
      errors: []
    };
  }

  const pathErrors = [...diffResult.errors];
  const contentErrors = [];

  const existingProfileMap = new Map();
  for (const file of existingProfileFiles) {
    const stem = String(file || '').replace(/\.json$/i, '').trim();
    if (stem) {
      existingProfileMap.set(stem.toLowerCase(), file);
    }
  }

  const seenCheerTargetDirs = new Map();
  const seenCheerFilesByTarget = new Map();
  const cheerFilesSetByTarget = new Map();
  const reportedCheerLimitTargets = new Set();

  for (const entry of existingCheerFiles) {
    const target = String(entry?.target || '').trim();
    const file = String(entry?.file || '').trim();
    if (!target || !file) continue;

    const targetKey = target.toLowerCase();
    const fileKey = file.toLowerCase();

    if (!seenCheerTargetDirs.has(targetKey)) {
      seenCheerTargetDirs.set(targetKey, target);
    }
    if (!seenCheerFilesByTarget.has(targetKey)) {
      seenCheerFilesByTarget.set(targetKey, new Map());
    }
    if (!seenCheerFilesByTarget.get(targetKey).has(fileKey)) {
      seenCheerFilesByTarget.get(targetKey).set(fileKey, file);
    }
    if (!cheerFilesSetByTarget.has(targetKey)) {
      cheerFilesSetByTarget.set(targetKey, new Set());
    }
    cheerFilesSetByTarget.get(targetKey).add(fileKey);
  }

  const prAddedProfileTargets = new Set();
  for (const item of changedFiles) {
    if (item.status === 'D') continue;
    const p = String(item.path || '');
    if (p.startsWith('data/profiles/') && p.endsWith('.json') && !p.startsWith('data/profiles/_')) {
      const rest = p.slice('data/profiles/'.length);
      if (!rest.includes('/')) {
        prAddedProfileTargets.add(rest.slice(0, -'.json'.length).toLowerCase());
      }
    }
  }

  const validTargets = new Set([...existingProfileMap.keys(), ...prAddedProfileTargets]);

  for (const item of changedFiles) {
    if (item.status === 'D') continue;
    const filePath = String(item.path || '');

    const isProfile =
      filePath.startsWith('data/profiles/') &&
      !filePath.slice('data/profiles/'.length).includes('/') &&
      filePath.endsWith('.json') &&
      !filePath.startsWith('data/profiles/_');

    const isCheer = (() => {
      if (!filePath.startsWith('data/cheers/')) return false;
      const segments = filePath.slice('data/cheers/'.length).split('/');
      return (
        segments.length === 2 &&
        segments[0] &&
        !segments[0].startsWith('_') &&
        segments[1] &&
        !segments[1].startsWith('_') &&
        segments[1].endsWith('.json')
      );
    })();

    if (!isProfile && !isCheer) {
      continue;
    }

    const raw = fileContents[filePath];
    if (typeof raw !== 'string') {
      contentErrors.push(`${filePath}: 无法读取文件内容，请检查文件是否已正确提交`);
      continue;
    }

    if (isProfile) {
      const filename = filePath.slice('data/profiles/'.length);
      const stem = filename.slice(0, -'.json'.length);
      const handleProblem = validateGithubHandle(stem);
      if (handleProblem) {
        contentErrors.push(`${filePath}: 文件名 "${stem}" 不是合法的 GitHub 用户名（${handleProblem}）`);
      }

      const existing = existingProfileMap.get(stem.toLowerCase());
      if (existing && existing !== filename) {
        contentErrors.push(
          `${filePath}: 与已有文件 data/profiles/${existing} 用户名重复（不区分大小写），请直接修改原文件`
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        contentErrors.push(`${filePath}: JSON 解析失败，${error.message}`);
        continue;
      }

      contentErrors.push(...validateJsonFormatting(raw, parsed, filePath));
      const profileCheck = validateProfile(parsed, filename);
      contentErrors.push(...profileCheck.errors);
      continue;
    }

    if (isCheer) {
      const [target, cheerFilename] = filePath.slice('data/cheers/'.length).split('/');
      const targetKey = target.toLowerCase();
      const fileKey = cheerFilename.toLowerCase();

      const targetHandleProblem = validateGithubHandle(target);
      if (targetHandleProblem) {
        contentErrors.push(`${filePath}: 目标目录名 "${target}" 不是合法的 GitHub 用户名（${targetHandleProblem}）`);
      }

      if (!validTargets.has(targetKey)) {
        contentErrors.push(
          `${filePath}: 未找到目标贡献者 "${target}" 对应的 data/profiles/${target}.json`
        );
      }

      const existingTargetDir = seenCheerTargetDirs.get(targetKey);
      if (existingTargetDir && existingTargetDir !== target) {
        contentErrors.push(
          `data/cheers/${target}: 与已有目录 data/cheers/${existingTargetDir} 重复（不区分大小写），请使用相同的目录名大小写`
        );
      } else if (!existingTargetDir) {
        seenCheerTargetDirs.set(targetKey, target);
      }

      if (!seenCheerFilesByTarget.has(targetKey)) {
        seenCheerFilesByTarget.set(targetKey, new Map());
      }
      const targetFileMap = seenCheerFilesByTarget.get(targetKey);
      const existingCheerFile = targetFileMap.get(fileKey);
      if (existingCheerFile && existingCheerFile !== cheerFilename) {
        contentErrors.push(
          `${filePath}: 与已有文件 data/cheers/${existingTargetDir || target}/${existingCheerFile} 文件名重复（不区分大小写）`
        );
      } else if (!existingCheerFile) {
        targetFileMap.set(fileKey, cheerFilename);
      }

      if (!cheerFilesSetByTarget.has(targetKey)) {
        cheerFilesSetByTarget.set(targetKey, new Set());
      }
      const targetCheerSet = cheerFilesSetByTarget.get(targetKey);
      targetCheerSet.add(fileKey);
      if (targetCheerSet.size > CHEERS_MAX_PER_PROFILE && !reportedCheerLimitTargets.has(targetKey)) {
        reportedCheerLimitTargets.add(targetKey);
        contentErrors.push(`data/cheers/${target}: 寄语最多 ${CHEERS_MAX_PER_PROFILE} 条，请删减`);
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        contentErrors.push(`${filePath}: JSON 解析失败，${error.message}`);
        continue;
      }

      contentErrors.push(...validateJsonFormatting(raw, parsed, filePath));
      const cheerCheck = validateCheerEntry(parsed, filePath);
      contentErrors.push(...cheerCheck.errors);
    }
  }

  const errors = [...pathErrors, ...contentErrors];
  return {
    ok: errors.length === 0,
    skipped: false,
    prAuthor: String(prAuthor || '').trim(),
    pathErrors,
    contentErrors,
    errors
  };
}

function formatGuardComment(result, { headSha = '' } = {}) {
  const authorMention = result.prAuthor ? `@${result.prAuthor} ` : '';
  const shortSha = String(headSha || '').trim().slice(0, 7);
  const shaBadge = shortSha ? `（提交 \`${shortSha}\`）` : '';

  if (result.ok) {
    return [
      COMMENT_MARKER,
      `### ✅ 自动格式与路径审查通过${shaBadge}`,
      '',
      `${authorMention}这个 PR 的变更范围、文件命名和 JSON 格式均符合仓库规范。`,
      '',
      '你的 PR 将在 5 分钟后自动合并（若在此期间推送了新的修改，将自动取消本次合并并重新审查）。'
    ].join('\n');
  }

  const lines = [
    COMMENT_MARKER,
    `### ❌ 自动格式与路径审查未通过${shaBadge}`,
    '',
    `${authorMention}请根据以下提示修改后重新 push（推送后机器人会自动回复新的审查结果）：`,
    ''
  ];

  if (result.pathErrors.length > 0) {
    lines.push('#### 1. 变更范围与路径问题');
    for (const err of result.pathErrors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  if (result.contentErrors.length > 0) {
    lines.push(result.pathErrors.length > 0 ? '#### 2. 文件内容与格式问题' : '#### 文件内容与格式问题');
    for (const err of result.contentErrors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  lines.push(
    '> 💡 提示：本地修改完成后可先运行 `npm run validate` 自检，确认无误后再 `git commit && git push`。'
  );

  return lines.join('\n');
}

module.exports = {
  COMMENT_MARKER,
  mapGithubStatus,
  normalizeGithubPrFiles,
  evaluatePrGuard,
  formatGuardComment,
  listProfileFiles,
  listCheerFiles,
  parseMaintainers
};
