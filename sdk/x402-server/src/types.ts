/**
 * types.ts — Types for x402 payment middleware
 */

/** What the merchant passes to withX402() */
export interface X402Config {
  /** Raw amount in token's smallest unit (e.g., '100000' for 0.1 USDC) */
  amount: string;
  /** Merchant's Fast address (fast1...) */
  recipient: string;
  /** Base64-encoded token ID */
  asset: string;
  /** Optional RPC URL override (defaults to https://api.fast.xyz/proxy) */
  rpcUrl?: string;
}

/** Single entry in the 402 response accepts array */
export interface X402Accept {
  scheme: 'exact';
  network: 'fast';
  maxAmountRequired: string;
  payTo: string;
  asset: string;
}

/** The full 402 response body */
export interface X402Response {
  x402Version: number;
  accepts: X402Accept[];
}

/** Parsed X-PAYMENT header payload (what the client sends) */
export interface X402PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    type: string;
    transactionCertificate: unknown;
  };
}

/** Result of verifyX402Payment() */
export interface VerifyResult {
  valid: boolean;
  txHash?: string;
  sender?: string;
  amount?: string;
  error?: string;
}
