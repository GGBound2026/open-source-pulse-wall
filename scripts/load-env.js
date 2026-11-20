#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Loads KEY=value pairs from root/.env into process.env when the key is unset.
 * Does not override variables already provided by the shell or the system.
 */
function loadEnvFile(root) {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function resolveGithubToken() {
  const fromEnv = String(process.env.GITHUB_TOKEN || '').trim();
  if (fromEnv) return fromEnv;

  try {
    const token = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      timeout: 3000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    if (token) {
      process.env.GITHUB_TOKEN = token;
      return token;
    }
  } catch {
    // Ignore when GitHub CLI is absent or not signed in.
  }

  return '';
}

module.exports = { loadEnvFile, resolveGithubToken };
