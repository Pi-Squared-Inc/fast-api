import { money } from '../../../../dist/src/index.js';
import { parseSetApiKeyBody, toErrorResponse } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) return '*'.repeat(apiKey.length);
  return `${apiKey.slice(0, 2)}${'*'.repeat(apiKey.length - 4)}${apiKey.slice(-2)}`;
}

export async function POST(request: Request) {
  try {
    const body = parseSetApiKeyBody((await request.json().catch(() => ({}))) as unknown);
    await money.setApiKey({
      provider: body.provider,
      apiKey: body.apiKey,
    });
    return Response.json({
      provider: body.provider,
      saved: true,
      maskedApiKey: maskApiKey(body.apiKey),
      savedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
