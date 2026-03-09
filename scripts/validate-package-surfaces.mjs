#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const siblingPackagePaths = [
  '../fast-sdk/package.json',
  '../allset-sdk/package.json',
  '../x402-sdk/packages/x402-client/package.json',
  '../x402-sdk/packages/x402-server/package.json',
  '../x402-sdk/packages/x402-facilitator/package.json',
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function readJson(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function collectAllowedPackages() {
  const discovered = new Set();
  for (const relativePath of siblingPackagePaths) {
    const pkg = readJson(relativePath);
    if (pkg?.name) {
      discovered.add(pkg.name);
    }
  }

  return discovered;
}

const allowedPackages = collectAllowedPackages();
const markdownFiles = walk(root);
const packagePattern = /@fastxyz\/[a-z0-9-]+/g;
const failures = [];
const foundPackages = new Set();

for (const filePath of markdownFiles) {
  const relativePath = path.relative(root, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(packagePattern) ?? [];

  for (const packageName of matches) {
    foundPackages.add(packageName);
    if (allowedPackages.size > 0 && !allowedPackages.has(packageName)) {
      failures.push(`${relativePath} -> unknown package ${packageName}`);
    }
  }
}

if (allowedPackages.size === 0) {
  console.warn('Skipped package-surface validation because sibling package manifests were not found.');
  process.exit(0);
}

for (const packageName of allowedPackages) {
  if (!foundPackages.has(packageName)) {
    failures.push(`docs missing package reference ${packageName}`);
  }
}

if (failures.length > 0) {
  console.error('Package surface validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${allowedPackages.size} FAST package names across ${markdownFiles.length} markdown files.`);
