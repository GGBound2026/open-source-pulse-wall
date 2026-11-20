#!/usr/bin/env node

const crypto = require('crypto');

const rawCode = process.argv.slice(2).join(' ').trim();

if (!rawCode) {
  console.error('Usage: node scripts/hash-relic.js "<SECRET_CODE>" [relic-id] [label]');
  process.exit(1);
}

const normalized = rawCode.trim().toUpperCase();
const sha256 = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');

const entry = {
  id: 'relic-01',
  label: 'Git 考古暗号 #1',
  sha256,
  points: 2
};

console.log('Normalized code (keep secret — bury in git history, do NOT put plaintext in data/relics.json):');
console.log(`  ${normalized}\n`);
console.log('Paste this object into data/relics.json -> "relics":');
console.log(JSON.stringify(entry, null, 2));
