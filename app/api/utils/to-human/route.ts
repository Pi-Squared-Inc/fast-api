import { money } from '../../../../dist/src/index.js';
import { parseToHumanBody, toErrorResponse } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const params = parseToHumanBody((await request.json().catch(() => ({}))) as unknown);
    const human = await money.toHumanUnits(params);
    return Response.json({
      human,
      request: params,
      convertedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
