import { money } from '../../../../dist/src/index.js';
import { parseIdentifyBody, toErrorResponse } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const params = parseIdentifyBody((await request.json().catch(() => ({}))) as unknown);
    const identify = await money.identifyChains(params);
    return Response.json({
      identify,
      request: params,
      resolvedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
