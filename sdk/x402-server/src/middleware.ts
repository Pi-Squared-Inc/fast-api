/**
 * middleware.ts — x402 payment building blocks
 *
 * Two building blocks that work in any framework:
 * - build402Body(config) — returns the 402 JSON object
 * - verifyX402Payment(header, config) — verifies the X-PAYMENT header
 *
 * Plus a convenience wrapper for Web API frameworks:
 * - withX402(config, handler) — combines both into a single handler
 */

import { verifyX402Payment } from './verify.js';
import { X402_VERSION, NETWORK } from './constants.js';
import type { X402Config, X402Response, VerifyResult } from './types.js';

/**
 * Build the 402 Payment Required response body.
 *
 * Returns a plain JSON object — use it in any framework to tell the client
 * what payment is required. The client (e.g. `x402Pay()` from `@pi2labs/fast-sdk`)
 * reads this and pays automatically.
 *
 * @example Express
 * ```ts
 * import { build402Body, verifyX402Payment, WELL_KNOWN_TOKENS } from '@pi2labs/x402-server';
 *
 * const config = {
 *   amount: '100000',
 *   recipient: 'fast1merchant...',
 *   asset: WELL_KNOWN_TOKENS.SETUSDC,
 * };
 *
 * app.get('/api/data', async (req, res) => {
 *   const header = req.headers['x-payment'] as string | undefined;
 *   if (!header) return res.status(402).json(build402Body(config));
 *
 *   const result = await verifyX402Payment(header, config);
 *   if (!result.valid) return res.status(402).json(build402Body(config));
 *
 *   res.json({ data: 'premium', paidBy: result.txHash });
 * });
 * ```
 *
 * @example Fastify
 * ```ts
 * fastify.get('/api/data', async (req, reply) => {
 *   const header = req.headers['x-payment'] as string | undefined;
 *   if (!header) return reply.status(402).send(build402Body(config));
 *
 *   const result = await verifyX402Payment(header, config);
 *   if (!result.valid) return reply.status(402).send(build402Body(config));
 *
 *   return { data: 'premium', paidBy: result.txHash };
 * });
 * ```
 *
 * @example NestJS Guard
 * ```ts
 * @Injectable()
 * class X402Guard implements CanActivate {
 *   async canActivate(ctx: ExecutionContext): Promise<boolean> {
 *     const req = ctx.switchToHttp().getRequest();
 *     const res = ctx.switchToHttp().getResponse();
 *     const header = req.headers['x-payment'];
 *     if (!header) { res.status(402).json(build402Body(config)); return false; }
 *     const result = await verifyX402Payment(header, config);
 *     if (!result.valid) { res.status(402).json(build402Body(config)); return false; }
 *     req.x402Payment = result;
 *     return true;
 *   }
 * }
 * ```
 */
export function build402Body(config: X402Config): X402Response {
  return {
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
}

/**
 * Wrap a Web API request handler with x402 payment verification.
 *
 * Convenience wrapper for frameworks that use standard Web API Request/Response
 * (Next.js App Router, Hono, Cloudflare Workers, Deno).
 *
 * For Express, NestJS, Fastify, or Koa — use `build402Body()` and
 * `verifyX402Payment()` directly. See examples on `build402Body()`.
 *
 * @example Next.js App Router
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
      return new Response(JSON.stringify(build402Body(config)), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await verifyX402Payment(xPayment, config);

    if (!result.valid) {
      return new Response(JSON.stringify(build402Body(config)), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(req, result);
  };
}
