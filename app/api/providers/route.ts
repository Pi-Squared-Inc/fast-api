import { money } from '../../../dist/src/index.js';
import { toErrorResponse } from './shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const providers = money.providers();
    return Response.json({
      providers,
      loadedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
