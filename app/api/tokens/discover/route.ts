import { money } from '../../../../dist/src/index.js';
import { parseDiscoverBody, toErrorResponse } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const params = parseDiscoverBody((await request.json().catch(() => ({}))) as unknown);
    const tokens = await money.tokens(params);
    return Response.json({
      tokens,
      request: params,
      discoveredAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
