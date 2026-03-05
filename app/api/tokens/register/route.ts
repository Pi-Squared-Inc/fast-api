import { money } from '../../../../dist/src/index.js';
import { parseRegisterBody, toErrorResponse } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const params = parseRegisterBody((await request.json().catch(() => ({}))) as unknown);
    await money.registerToken(params);
    const token = await money.getToken({
      chain: params.chain,
      name: params.name,
      ...(params.network ? { network: params.network } : {}),
    });
    return Response.json({
      saved: true,
      token,
      request: params,
      registeredAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
