#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROFILES_DIR = path.join(ROOT, 'data', 'profiles');
const CHEERS_DIR = path.join(ROOT, 'data', 'cheers');

const CHEERS_MAX_PER_PROFILE = 50;
const CHEER_MESSAGE_MAX_LENGTH = 80;

function listProfileFiles() {
  if (!fs.existsSync(PROFILES_DIR)) {
    return [];
  }

  return fs.readdirSync(PROFILES_DIR)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => !file.startsWith('_'))
    .sort();
}

function listCheerFiles() {
  if (!fs.existsSync(CHEERS_DIR)) {
    return [];
  }

  const items = [];
  const entries = fs.readdirSync(CHEERS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dirEntry of entries) {
    const target = dirEntry.name;
    const targetDir = path.join(CHEERS_DIR, target);
    const files = fs.readdirSync(targetDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('_'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      items.push({
        target,
        file,
        relPath: `data/cheers/${target}/${file}`
      });
    }
  }

  return items;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateGithubHandle(value) {
  if (typeof value !== 'string') return 'github 必须是字符串';
  const trimmed = value.trim();
  if (!trimmed) return 'github 不能为空';
  if (trimmed.length > 39) return 'github 不能超过 39 个字符';
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) return 'github 只能包含字母、数字和连字符';
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) return 'github 不能以连字符开头或结尾';
  if (trimmed.includes('--')) return 'github 不能包含连续连字符';
  return null;
}

function isHttpUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return true;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function requiredString(profile, key, label, errors, filename, maxLength = 80) {
  const value = profile[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${filename}: ${label} 必须填写`);
    return;
  }

  if (value.trim().length > maxLength) {
    errors.push(`${filename}: ${label} 过长，最多 ${maxLength} 个字符`);
  }
}

function validateCheerEntry(entry, relPath, { targetOwner = '' } = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(entry)) {
    return {
      errors: [`${relPath}: 文件内容必须是一个 JSON 对象，例如 { "message": "加油！" }`],
      warnings
    };
  }

  if (typeof entry.message !== 'string' || entry.message.trim().length === 0) {
    errors.push(`${relPath}: message 必须填写`);
  } else if (entry.message.trim().length > CHEER_MESSAGE_MAX_LENGTH) {
    errors.push(`${relPath}: message 过长，最多 ${CHEER_MESSAGE_MAX_LENGTH} 个字符`);
  }

  if (entry.from !== undefined) {
    const fromProblem = validateGithubHandle(entry.from);
    if (fromProblem) {
      errors.push(`${relPath}: from ${fromProblem}`);
    } else {
      const owner = String(targetOwner || '').trim().toLowerCase();
      const fromHandle = String(entry.from || '').trim().toLowerCase();
      if (owner && fromHandle && fromHandle === owner) {
        errors.push(`${relPath}: 不能是 profile 主人自己给自己写寄语`);
      }
    }
  }

  if (entry.ts !== undefined) {
    if (typeof entry.ts !== 'string' || Number.isNaN(Date.parse(entry.ts))) {
      errors.push(`${relPath}: ts 必须是 ISO 时间字符串，例如 2026-05-09`);
    }
  }

  return { errors, warnings };
}

function validateProfile(profile, filename) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(profile)) {
    return { errors: [`${filename}: 文件内容必须是一个 JSON 对象`], warnings };
  }

  requiredString(profile, 'name', 'name', errors, filename, 40);
  if (typeof profile.name === 'string' && profile.name.trim() === '你的名字' && !String(filename).startsWith('_')) {
    errors.push(`${filename}: 请将 name 从模板默认值「你的名字」改成你自己的名字或昵称`);
  }

  requiredString(profile, 'motto', 'motto', errors, filename, 120);

  if (profile.city !== undefined && (typeof profile.city !== 'string' || profile.city.trim().length > 40)) {
    errors.push(`${filename}: city 必须是 40 个字符以内的字符串`);
  }

  if (profile.cheers !== undefined) {
    if (!Array.isArray(profile.cheers) || profile.cheers.length > 0) {
      errors.push(
        `${filename}: 寄语已改为独立文件，请创建 data/cheers/<目标用户名>/<任意文件名>.json（仅需填写 { "message": "..." }）`
      );
    }
  }

  return { errors, warnings };
}

function readAndValidateAll() {
  const files = listProfileFiles();
  const errors = [];
  const warnings = [];
  const contributors = [];
  const validTargets = new Set();

  for (const file of files) {
    const filePath = path.join(PROFILES_DIR, file);
    const stem = file.replace(/\.json$/i, '').trim().toLowerCase();
    if (stem) validTargets.add(stem);

    let profile;
    try {
      profile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      errors.push(`${file}: JSON 解析失败，${error.message}`);
      continue;
    }

    const result = validateProfile(profile, file);
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    contributors.push({ ...profile, file });
  }

  if (contributors.length === 0) {
    warnings.push('当前还没有贡献者文件。课堂上每位同学可以从 data/profiles/_template.json 复制一份。');
  }

  const cheerFiles = listCheerFiles();
  const cheerEntries = [];
  const cheersCountByTarget = new Map();

  for (const item of cheerFiles) {
    const targetKey = item.target.trim().toLowerCase();
    if (!validTargets.has(targetKey)) {
      errors.push(`${item.relPath}: 未找到目标贡献者 "${item.target}" 对应的 data/profiles/${item.target}.json`);
    }

    const nextCount = (cheersCountByTarget.get(targetKey) || 0) + 1;
    cheersCountByTarget.set(targetKey, nextCount);
    if (nextCount === CHEERS_MAX_PER_PROFILE + 1) {
      errors.push(`data/cheers/${item.target}: 寄语最多 ${CHEERS_MAX_PER_PROFILE} 条，请删减`);
    }

    const fullPath = path.join(ROOT, item.relPath);
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
      errors.push(`${item.relPath}: JSON 解析失败，${error.message}`);
      continue;
    }

    const result = validateCheerEntry(parsed, item.relPath, { targetOwner: targetKey });
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    cheerEntries.push({
      target: item.target,
      file: item.file,
      relPath: item.relPath,
      message: typeof parsed?.message === 'string' ? parsed.message.trim() : '',
      ...(typeof parsed?.from === 'string' ? { from: parsed.from.trim() } : {}),
      ...(typeof parsed?.ts === 'string' ? { ts: parsed.ts.trim() } : {})
    });
  }

  return { contributors, cheerEntries, errors, warnings };
}

if (require.main === module) {
  const { contributors, cheerEntries, errors, warnings } = readAndValidateAll();

  console.log('\nOpen Source Pulse Wall validation');
  console.log(`Profiles: ${contributors.length}`);
  console.log(`Cheers: ${cheerEntries.length}`);

  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach((warning) => console.log(`  • ${warning}`));
  }

  if (errors.length) {
    console.log('\nErrors:');
    errors.forEach((error) => console.log(`  ✗ ${error}`));
    console.log('\nValidation failed. Fix the file and run npm run validate again.\n');
    process.exit(1);
  }

  console.log('\nValidation passed. Ready to open a Pull Request.\n');
}

module.exports = {
  listProfileFiles,
  listCheerFiles,
  readAndValidateAll,
  validateProfile,
  validateCheerEntry,
  validateGithubHandle,
  isHttpUrl,
  isHttpsUrl,
  CHEERS_MAX_PER_PROFILE,
  CHEER_MESSAGE_MAX_LENGTH
};
