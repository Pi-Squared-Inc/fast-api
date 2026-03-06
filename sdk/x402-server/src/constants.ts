/**
 * constants.ts — Protocol constants for x402 FastSet payments
 */

/** x402 protocol version */
export const X402_VERSION = 1;

/** Network identifier used in 402 responses */
export const NETWORK = 'fast';

/** Default FastSet RPC URL */
export const DEFAULT_RPC_URL = 'https://api.fast.xyz/proxy';

/** Well-known token IDs (base64-encoded 32-byte token IDs) */
export const WELL_KNOWN_TOKENS = {
  /** SET native token — 0xfa575e70 padded to 32 bytes */
  SET: Buffer.from(
    'fa575e70' + '0'.repeat(56),
    'hex',
  ).toString('base64'),
  /** SETUSDC — fastUSDC bridged stablecoin */
  SETUSDC: Buffer.from(
    '1e744900021182b29352cbb6685b77df095e35136cd550021614ce928daae782',
    'hex',
  ).toString('base64'),
} as const;
