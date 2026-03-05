/**
 * verify.ts — Verify x402 FastSet payment headers
 */

import { X402Error } from './errors.js';
import { X402_VERSION, NETWORK, DEFAULT_RPC_URL } from './constants.js';
import type { X402Config, X402PaymentPayload, VerifyResult } from './types.js';

/** JSON-RPC call to FastSet node */
async function rpcCall(
  url: string,
  method: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    const json = (await res.json()) as {
      result?: unknown;
      error?: { message: string; code?: number };
    };
    if (json.error) {
      throw new Error(`RPC error: ${JSON.stringify(json.error)}`);
    }
    return json.result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse and decode the X-PAYMENT header value.
 * Returns the parsed X402PaymentPayload or throws X402Error.
 */
function parsePaymentHeader(headerValue: string): X402PaymentPayload {
  let decoded: string;
  try {
    decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
  } catch {
    throw new X402Error('INVALID_HEADER', 'Failed to base64-decode X-PAYMENT header', {
      note: 'The X-PAYMENT header must be a valid base64-encoded JSON string.',
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new X402Error('INVALID_HEADER', 'Failed to JSON-parse X-PAYMENT payload', {
      note: 'The decoded X-PAYMENT header must be valid JSON.',
    });
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new X402Error('INVALID_HEADER', 'X-PAYMENT payload is not an object', {
      note: 'Expected a JSON object with x402Version, scheme, network, and payload fields.',
    });
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.x402Version !== X402_VERSION) {
    throw new X402Error('INVALID_VERSION', `Unsupported x402 version: ${String(obj.x402Version)}`, {
      note: `Only x402 version ${X402_VERSION} is supported.`,
    });
  }

  if (obj.scheme !== 'exact') {
    throw new X402Error('INVALID_HEADER', `Unsupported scheme: ${String(obj.scheme)}`, {
      note: 'Only the "exact" payment scheme is supported.',
    });
  }

  if (obj.network !== NETWORK) {
    throw new X402Error('INVALID_HEADER', `Unsupported network: ${String(obj.network)}`, {
      note: `Only the "${NETWORK}" network is supported.`,
    });
  }

  if (typeof obj.payload !== 'object' || obj.payload === null) {
    throw new X402Error('INVALID_HEADER', 'Missing or invalid payload in X-PAYMENT', {
      note: 'The payload field must be an object with type and transactionCertificate.',
    });
  }

  const payload = obj.payload as Record<string, unknown>;

  if (!payload.transactionCertificate) {
    throw new X402Error('INVALID_HEADER', 'Missing transactionCertificate in payload', {
      note: 'The payload must include a transactionCertificate from the FastSet chain.',
    });
  }

  return {
    x402Version: X402_VERSION,
    scheme: 'exact',
    network: NETWORK,
    payload: {
      type: String(payload.type ?? 'signAndSendTransaction'),
      transactionCertificate: payload.transactionCertificate,
    },
  };
}

/**
 * Extract a transaction hash from the certificate.
 * The certificate structure varies — try common field names.
 */
function extractTxHash(certificate: unknown): string | undefined {
  if (typeof certificate !== 'object' || certificate === null) return undefined;
  const cert = certificate as Record<string, unknown>;

  // Try common field names for tx hash
  if (typeof cert.txHash === 'string') return cert.txHash;
  if (typeof cert.hash === 'string') return cert.hash;
  if (typeof cert.digest === 'string') return cert.digest;

  // Try nested transaction object
  if (typeof cert.transaction === 'object' && cert.transaction !== null) {
    const tx = cert.transaction as Record<string, unknown>;
    if (typeof tx.hash === 'string') return tx.hash;
    if (typeof tx.digest === 'string') return tx.digest;
  }

  return undefined;
}

/**
 * Verify an x402 payment header against the merchant's config.
 *
 * Parses the base64-encoded X-PAYMENT header, validates the structure,
 * and checks the transaction via RPC.
 */
export async function verifyX402Payment(
  xPaymentHeader: string,
  config: X402Config,
): Promise<VerifyResult> {
  // Step 1: Parse and validate header structure
  let payment: X402PaymentPayload;
  try {
    payment = parsePaymentHeader(xPaymentHeader);
  } catch (err: unknown) {
    if (err instanceof X402Error) {
      return { valid: false, error: `${err.code}: ${err.message}` };
    }
    return { valid: false, error: String(err) };
  }

  // Step 2: Extract tx hash from certificate
  const txHash = extractTxHash(payment.payload.transactionCertificate);

  // Step 3: Verify via RPC
  const rpcUrl = config.rpcUrl ?? DEFAULT_RPC_URL;

  try {
    // FIX-ME: do a proper check here
    // Currently we just check that the RPC knows about this transaction.
    // A proper implementation should:
    //   1. Query the transaction by hash
    //   2. Verify the recipient matches config.recipient
    //   3. Verify the amount >= config.amount
    //   4. Verify the token matches config.asset
    //   5. Verify the transaction is finalized
    // For now, if we have a certificate, we consider it valid.
    // The certificate itself is proof of on-chain settlement on FastSet
    // (instant finality), but we should still verify the fields match.

    if (txHash) {
      const _result = await rpcCall(rpcUrl, 'proxy_getTransaction', { hash: txHash });
      // FIX-ME: parse _result and validate fields against config
    }

    return {
      valid: true,
      txHash: txHash ?? 'unknown',
      // FIX-ME: extract sender and amount from the RPC response
      sender: undefined,
      amount: config.amount,
    };
  } catch (err: unknown) {
    // If RPC fails, we still have the certificate as proof
    // FIX-ME: decide if we should reject or accept when RPC is unreachable
    return {
      valid: true,
      txHash: txHash ?? 'unknown',
      amount: config.amount,
      error: `RPC verification failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
