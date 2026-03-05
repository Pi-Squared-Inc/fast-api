/**
 * middleware.ts — x402 payment gate for Web API handlers
 *
 * Works with any framework that uses the standard Web API Request/Response
 * (Next.js App Router, Hono, Cloudflare Workers, Deno, etc.)
 */

import { verifyX402Payment } from './verify.js';
import { X402_VERSION, NETWORK } from './constants.js';
import type { X402Config, X402Response, VerifyResult } from './types.js';

/** Build the 402 Payment Required response */
function build402Response(config: X402Config): Response {
  const body: X402Response = {
    x402Version: X402_VERSION,
    accepts: [
      {
        scheme: 'exact',
        network: NETWORK,
        maxAmountRequired: config.amount,
        payTo: config.recipient,
        asset: config.asset,
      },
    ],
  };

  return new Response(JSON.stringify(body), {
    status: 402,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Wrap a request handler with x402 payment verification.
 *
 * If the request has no X-PAYMENT header, returns 402 with payment requirements.
 * If the header is present and valid, calls the handler with the verified payment.
 * If the header is present but invalid, returns 402 again.
 *
 * @example
 * ```ts
 * import { withX402, WELL_KNOWN_TOKENS } from '@pi2labs/x402-server';
 *
 * export const GET = withX402({
 *   amount: '100000',
 *   recipient: 'fast1merchant...',
 *   asset: WELL_KNOWN_TOKENS.SETUSDC,
 * }, async (req, payment) => {
 *   return Response.json({ data: 'premium content', paidBy: payment.txHash });
 * });
 * ```
 */
export function withX402(
  config: X402Config,
  handler: (req: Request, payment: VerifyResult) => Response | Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const xPayment = req.headers.get('x-payment') ?? req.headers.get('X-PAYMENT');

    if (!xPayment) {
      return build402Response(config);
    }

    const result = await verifyX402Payment(xPayment, config);

    if (!result.valid) {
      return build402Response(config);
    }

    return handler(req, result);
  };
}
