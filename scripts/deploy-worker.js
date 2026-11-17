#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WORKER_PATH = path.join(ROOT, 'cloudflare', 'worker.mjs');
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

const SCRIPT_NAME = process.env.CF_WORKER_NAME || 'open-source-pulse-wall-api';
const CUSTOM_DOMAIN = process.env.CF_WORKER_DOMAIN || 'pulse-wall-api.yoryon.com';
const ZONE_NAME = process.env.CF_ZONE_NAME || 'yoryon.com';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'nanzhi84/open-source-pulse-wall';
const REFRESH_COOLDOWN_MS = String(process.env.REFRESH_COOLDOWN_MS || '180000');

function loadCloudflareCredentialsFromDisk() {
  const credPath = path.join(os.homedir(), '.config', 'cloudflare', 'credentials.env');
  if (!fs.existsSync(credPath)) return;

  const lines = fs.readFileSync(credPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim().replace(/^export\s+/, '');
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if ((key === 'CLOUDFLARE_API_TOKEN' || key === 'CLOUDFLARE_ACCOUNT_ID') && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function cfRequest(pathname, apiToken, options = {}) {
  const response = await fetch(`${CF_API_BASE}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Cloudflare API ${response.status} non-JSON response: ${text.slice(0, 200)}`);
  }

  if (!response.ok || !parsed.success) {
    const details = Array.isArray(parsed.errors) && parsed.errors.length
      ? parsed.errors.map((err) => `[${err.code}] ${err.message}`).join('; ')
      : `HTTP ${response.status}`;
    const error = new Error(`Cloudflare API error on ${pathname}: ${details}`);
    error.status = response.status;
    throw error;
  }

  return parsed.result;
}

async function uploadWorkerScript({ accountId, apiToken, workerSource, keepBindings }) {
  const metadata = {
    main_module: 'worker.mjs',
    compatibility_date: '2025-01-01',
    bindings: [
      { type: 'plain_text', name: 'GITHUB_REPOSITORY', text: GITHUB_REPOSITORY },
      { type: 'plain_text', name: 'REFRESH_COOLDOWN_MS', text: REFRESH_COOLDOWN_MS }
    ]
  };
  if (keepBindings) {
    metadata.keep_bindings = ['secret_text'];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('worker.mjs', new Blob([workerSource], { type: 'application/javascript+module' }), 'worker.mjs');

  return cfRequest(`/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(SCRIPT_NAME)}`, apiToken, {
    method: 'PUT',
    body: form
  });
}

async function deploy() {
  loadCloudflareCredentialsFromDisk();

  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  if (!apiToken || !accountId) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID');
  }

  if (!fs.existsSync(WORKER_PATH)) {
    throw new Error(`Worker source not found: ${WORKER_PATH}`);
  }
  const workerSource = fs.readFileSync(WORKER_PATH, 'utf8');

  try {
    await uploadWorkerScript({ accountId, apiToken, workerSource, keepBindings: true });
  } catch (firstError) {
    // First-time script creation can reject keep_bindings when no prior script exists.
    await uploadWorkerScript({ accountId, apiToken, workerSource, keepBindings: false });
  }
  console.log(`Uploaded Worker script: ${SCRIPT_NAME}`);

  const workerGithubToken = String(process.env.WORKER_GITHUB_TOKEN || '').trim();
  if (workerGithubToken) {
    await cfRequest(
      `/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(SCRIPT_NAME)}/secrets`,
      apiToken,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'GITHUB_TOKEN',
          text: workerGithubToken,
          type: 'secret_text'
        })
      }
    );
    console.log('Updated secret: GITHUB_TOKEN');
  } else {
    console.log('Skipped GITHUB_TOKEN secret update (WORKER_GITHUB_TOKEN not set)');
  }

  const zones = await cfRequest(`/zones?name=${encodeURIComponent(ZONE_NAME)}`, apiToken);
  if (!Array.isArray(zones) || !zones.length || !zones[0].id) {
    throw new Error(`Cloudflare zone not found for ${ZONE_NAME}`);
  }
  const zoneId = zones[0].id;

  await cfRequest(`/accounts/${encodeURIComponent(accountId)}/workers/domains`, apiToken, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hostname: CUSTOM_DOMAIN,
      service: SCRIPT_NAME,
      zone_id: zoneId,
      environment: 'production'
    })
  });

  console.log(`Attached custom domain: https://${CUSTOM_DOMAIN}`);
}

deploy().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
