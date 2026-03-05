import { money, MoneyError } from '../../../../../dist/src/index.js';
import { ensureMoneyConfigDir } from '../../../../lib/ensure-money-config-dir';
import { applyServerWalletEnv } from '../../../../lib/server-wallet-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type NetworkType = 'testnet' | 'mainnet';

function inferStatus(error: MoneyError): number {
  if (error.code === 'INVALID_PARAMS' || error.code === 'INVALID_ADDRESS') {
    return 400;
  }
  if (error.code === 'CHAIN_NOT_CONFIGURED') {
    return 409;
  }
  if (error.code === 'TOKEN_NOT_FOUND') {
    return 404;
  }
  return 500;
}

function isDebugAuthorized(request: Request): boolean {
  const expected = process.env.MONEY_SEND_DEBUG_SECRET?.trim();
  if (!expected) return false;
  const provided = request.headers.get('x-money-debug-secret')?.trim();
  return !!provided && provided === expected;
}

export async function GET(request: Request) {
  if (!process.env.MONEY_SEND_DEBUG_SECRET?.trim()) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (!isDebugAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const chain = (url.searchParams.get('chain') ?? 'fast').trim();
  const network: NetworkType = url.searchParams.get('network') === 'mainnet' ? 'mainnet' : 'testnet';
  const token = (url.searchParams.get('token') ?? '').trim();

  try {
    const configDir = await ensureMoneyConfigDir();
    const walletEnv = applyServerWalletEnv(chain, network);
    const setup = await money.setup({ chain, network });
    const nativeBalance = await money.balance({ chain, network });
    const discovered = await money.tokens({ chain, network });

    let tokenBalance: Awaited<ReturnType<typeof money.balance>> | null = null;
    let tokenError: { code: string; error: string; note: string | null } | null = null;

    if (token) {
      try {
        tokenBalance = await money.balance({ chain, network, token });
      } catch (error: unknown) {
        if (error instanceof MoneyError) {
          tokenError = {
            code: error.code,
            error: error.message,
            note: error.note ?? null,
          };
        } else {
          tokenError = {
            code: 'UNKNOWN_ERROR',
            error: error instanceof Error ? error.message : String(error),
            note: null,
          };
        }
      }
    }

    return Response.json({
      request: {
        chain,
        network,
        token: token || null,
      },
      wallet: {
        chain: setup.chain,
        network: setup.network,
        address: setup.address,
        envKeySource: walletEnv.source,
      },
      balances: {
        native: nativeBalance,
        token: tokenBalance,
        tokenError,
      },
      discovered,
      configDir,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof MoneyError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          note: error.note ?? null,
        },
        { status: inferStatus(error) },
      );
    }
    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 },
    );
  }
}
