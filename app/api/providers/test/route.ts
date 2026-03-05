import { money } from '../../../../dist/src/index.js';
import {
  getPriceProvider,
  getSwapProvider,
} from '../../../../dist/src/providers/registry.js';
import { parseProviderTestBody, toErrorResponse, toExecutionError } from '../shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SelectedProvider = {
  name: string;
  chains?: string[];
  networks?: string[];
} | null;

function summarizeSwapProvider(chain: string, providerName?: string): SelectedProvider {
  const selected = getSwapProvider(chain, providerName);
  if (!selected) return null;
  return {
    name: selected.name,
    chains: [...selected.chains],
  };
}

function summarizePriceProvider(chain?: string, providerName?: string): SelectedProvider {
  const selected = getPriceProvider(providerName, chain);
  if (!selected) return null;
  return {
    name: selected.name,
    ...(selected.chains ? { chains: [...selected.chains] } : {}),
  };
}

export async function POST(request: Request) {
  try {
    const parsed = parseProviderTestBody((await request.json().catch(() => ({}))) as unknown);

    if (parsed.operation === 'quote') {
      const selectedProvider = summarizeSwapProvider(parsed.chain, parsed.provider);
      const quoteParams = {
        chain: parsed.chain,
        from: parsed.from,
        to: parsed.to,
        amount: parsed.amount,
        network: parsed.network,
        ...(parsed.slippageBps !== undefined ? { slippageBps: parsed.slippageBps } : {}),
        ...(parsed.provider ? { provider: parsed.provider } : {}),
      };

      try {
        const result = await money.quote(quoteParams);
        return Response.json({
          operation: 'quote',
          request: parsed,
          selectedProvider: selectedProvider ?? { name: result.provider, chains: [parsed.chain] },
          result,
          execution: {
            ok: true,
            at: new Date().toISOString(),
          },
          note: 'Provider selection resolved and quote executed successfully.',
        });
      } catch (err: unknown) {
        return Response.json({
          operation: 'quote',
          request: parsed,
          selectedProvider,
          result: null,
          execution: {
            ok: false,
            at: new Date().toISOString(),
            error: toExecutionError(err),
          },
          note: 'Provider selection resolved, but quote execution failed.',
        });
      }
    }

    const selectedProvider = summarizePriceProvider(parsed.chain, parsed.provider);
    const priceParams = {
      token: parsed.token,
      ...(parsed.chain ? { chain: parsed.chain } : {}),
      ...(parsed.provider ? { provider: parsed.provider } : {}),
    };

    try {
      const result = await money.price(priceParams);
      return Response.json({
        operation: 'price',
        request: parsed,
        selectedProvider,
        result,
        execution: {
          ok: true,
          at: new Date().toISOString(),
        },
        note: 'Provider selection resolved and price lookup executed successfully.',
      });
    } catch (err: unknown) {
      return Response.json({
        operation: 'price',
        request: parsed,
        selectedProvider,
        result: null,
        execution: {
          ok: false,
          at: new Date().toISOString(),
          error: toExecutionError(err),
        },
        note: 'Provider selection resolved, but price lookup failed.',
      });
    }
  } catch (err: unknown) {
    return toErrorResponse(err);
  }
}
