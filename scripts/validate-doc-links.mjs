#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

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

function validateLink(filePath, rawLink) {
  if (!rawLink.startsWith('./') && !rawLink.startsWith('../')) {
    return null;
  }

  const [relativeTarget] = rawLink.split('#');
  const resolvedPath = path.resolve(path.dirname(filePath), relativeTarget);

  if (!fs.existsSync(resolvedPath)) {
    return `${path.relative(root, filePath)} -> ${rawLink}`;
  }

  return null;
}

const markdownFiles = walk(root);
const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const failures = [];

for (const filePath of markdownFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(linkPattern)) {
    const rawLink = match[1];
    const failure = validateLink(filePath, rawLink);
    if (failure) {
      failures.push(failure);
    }
  }
}

if (failures.length > 0) {
  console.error('Broken relative markdown links found:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${markdownFiles.length} markdown files.`);
