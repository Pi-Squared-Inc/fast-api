/**
 * @pi2labs/x402-server — x402 payment verification for FastSet
 *
 * Gate any API behind micropayments. Two building blocks that work
 * in any framework, plus a convenience wrapper for Web API frameworks.
 *
 * @example Building blocks (Express, NestJS, Fastify, Koa, anything)
 * ```ts
 * import { build402Body, verifyX402Payment, WELL_KNOWN_TOKENS } from '@pi2labs/x402-server';
 *
 * const config = { amount: '100000', recipient: 'fast1...', asset: WELL_KNOWN_TOKENS.SETUSDC };
 *
 * // In your route handler:
 * const header = req.headers['x-payment'];
 * if (!header) return res.status(402).json(build402Body(config));
 * const result = await verifyX402Payment(header, config);
 * if (!result.valid) return res.status(402).json(build402Body(config));
 * // Payment verified — serve content
 * ```
 *
 * @example Web API wrapper (Next.js App Router, Hono, Cloudflare Workers)
 * ```ts
 * import { withX402, WELL_KNOWN_TOKENS } from '@pi2labs/x402-server';
 *
 * export const GET = withX402({
 *   amount: '100000',
 *   recipient: 'fast1...',
 *   asset: WELL_KNOWN_TOKENS.SETUSDC,
 * }, async (req, payment) => {
 *   return Response.json({ data: 'premium content' });
 * });
 * ```
 */

// Building blocks — work in any framework
export { build402Body } from './middleware.js';
export { verifyX402Payment } from './verify.js';

// Convenience wrapper — Web API frameworks only
export { withX402 } from './middleware.js';

// Errors
export { X402Error } from './errors.js';
export type { X402ErrorCode } from './errors.js';

// Constants
export { X402_VERSION, NETWORK, DEFAULT_RPC_URL, WELL_KNOWN_TOKENS } from './constants.js';

// Types
export type {
  X402Config,
  X402Accept,
  X402Response,
  X402PaymentPayload,
  VerifyResult,
} from './types.js';
