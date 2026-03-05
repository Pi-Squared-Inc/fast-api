import { headers } from 'next/headers';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { originFromHost } from '../lib/origin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const content = readFileSync(join(process.cwd(), 'SKILL.md'), 'utf-8');
  const host = (await headers()).get('host') || 'localhost:3000';
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
  const version = pkg.version || '0.0.0';
  const baseUrl = originFromHost(host);
  const replaced = content
    .replaceAll('{{HOST}}', baseUrl)
    .replaceAll('{{VERSION}}', version);
  return new Response(replaced, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
