import { money } from '../../../../dist/src/index.js';
import { parseGetBody, toErrorResponse } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const params = parseGetBody((await request.json().catch(() => ({}))) as unknown);
    const token = await money.getToken(params);
    return Response.json({
      token,
      found: token !== null,
      request: params,
      resolvedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
