/**
 * @pi2labs/x402-server — x402 payment middleware for FastSet
 *
 * Gate any API behind micropayments. Works with any Web API-compatible framework.
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
 *   return Response.json({ data: 'premium content' });
 * });
 * ```
 */

// Middleware
export { withX402 } from './middleware.js';

// Verification
export { verifyX402Payment } from './verify.js';

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
