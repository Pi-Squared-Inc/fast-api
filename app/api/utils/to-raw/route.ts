import { money } from '../../../../dist/src/index.js';
import { parseToRawBody, toErrorResponse } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const params = parseToRawBody((await request.json().catch(() => ({}))) as unknown);
    const raw = await money.toRawUnits(params);
    const rawString = raw.toString();
    return Response.json({
      raw: rawString,
      rawBigintLiteral: `${rawString}n`,
      request: params,
      convertedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
