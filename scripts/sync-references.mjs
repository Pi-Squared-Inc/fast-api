#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

const repos = [
  ['fast-sdk', '../fast-sdk/package.json'],
  ['allset-sdk', '../allset-sdk/package.json'],
  ['x402-root', '../x402-sdk/package.json'],
  ['x402-client', '../x402-sdk/packages/x402-client/package.json'],
  ['x402-server', '../x402-sdk/packages/x402-server/package.json'],
  ['x402-facilitator', '../x402-sdk/packages/x402-facilitator/package.json'],
];

function readJson(relativePath) {
  const absolutePath = path.resolve(cwd, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      absolutePath,
      json: null,
    };
  }
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return { absolutePath, json: JSON.parse(raw) };
}

const rows = repos.map(([label, relativePath]) => {
  const { absolutePath, json } = readJson(relativePath);
  return {
    label,
    packageName: json?.name ?? '(missing)',
    version: json?.version ?? '(missing)',
    path: absolutePath,
  };
});

console.log('# FAST package inventory');
console.log('');
for (const row of rows) {
  console.log(`- ${row.label}: ${row.packageName}@${row.version}`);
  console.log(`  ${row.path}`);
}
