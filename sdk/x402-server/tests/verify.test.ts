import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { verifyX402Payment } from '../src/verify.js';

// ---------------------------------------------------------------------------
// Shared test config
// ---------------------------------------------------------------------------

const config = {
  amount: '100000',
  recipient: 'fast1merchantaddress',
  asset: Buffer.from(
    '1e744900021182b29352cbb6685b77df095e35136cd550021614ce928daae782',
    'hex',
  ).toString('base64'),
  rpcUrl: 'https://test-rpc.example.com',
};

// ---------------------------------------------------------------------------
// Helper — build a valid base64-encoded X-PAYMENT header
// ---------------------------------------------------------------------------

function makeValidHeader(overrides?: {
  x402Version?: number;
  scheme?: string;
  network?: string;
  payload?: unknown;
}): string {
  const payload = {
    x402Version: overrides?.x402Version ?? 1,
    scheme: overrides?.scheme ?? 'exact',
    network: overrides?.network ?? 'fast',
    payload: overrides?.payload ?? {
      type: 'signAndSendTransaction',
      transactionCertificate: {
        txHash: '0xabc123',
        signatures: [],
        transaction: {},
      },
    },
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('verifyX402Payment()', () => {
  beforeEach(() => {
    // Mock fetch globally to prevent real network calls
    mock.method(globalThis, 'fetch', async () => {
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('valid payment header returns valid result', async () => {
    const header = makeValidHeader();
    const result = await verifyX402Payment(header, config);

    assert.equal(result.valid, true);
    assert.equal(result.txHash, '0xabc123');
  });

  it('malformed base64 returns invalid', async () => {
    const result = await verifyX402Payment('not-valid-base64!!!', config);

    assert.equal(result.valid, false);
    assert.ok(
      result.error?.includes('INVALID_HEADER'),
      `expected error to contain "INVALID_HEADER", got: ${result.error}`,
    );
  });

  it('invalid JSON returns invalid', async () => {
    const header = Buffer.from('hello world').toString('base64');
    const result = await verifyX402Payment(header, config);

    assert.equal(result.valid, false);
    assert.ok(result.error !== undefined, 'expected error to be set');
  });

  it('wrong x402Version returns invalid', async () => {
    const header = makeValidHeader({ x402Version: 99 });
    const result = await verifyX402Payment(header, config);

    assert.equal(result.valid, false);
    assert.ok(
      result.error?.includes('INVALID_VERSION'),
      `expected error to contain "INVALID_VERSION", got: ${result.error}`,
    );
  });

  it('wrong scheme returns invalid', async () => {
    const header = makeValidHeader({ scheme: 'subscription' });
    const result = await verifyX402Payment(header, config);

    assert.equal(result.valid, false);
    assert.ok(result.error !== undefined, 'expected error to be set');
  });

  it('wrong network returns invalid', async () => {
    const header = makeValidHeader({ network: 'ethereum' });
    const result = await verifyX402Payment(header, config);

    assert.equal(result.valid, false);
    assert.ok(result.error !== undefined, 'expected error to be set');
  });

  it('missing transactionCertificate returns invalid', async () => {
    const header = makeValidHeader({
      payload: {
        type: 'signAndSendTransaction',
        // no transactionCertificate
      },
    });
    const result = await verifyX402Payment(header, config);

    assert.equal(result.valid, false);
    assert.ok(result.error !== undefined, 'expected error to be set');
  });

  it('RPC failure still returns valid (certificate is proof of settlement)', async () => {
    // Override the mock to throw a network error
    mock.restoreAll();
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('Network unreachable');
    });

    const header = makeValidHeader();
    const result = await verifyX402Payment(header, config);

    assert.equal(
      result.valid,
      true,
      'certificate itself is proof of settlement; RPC failure should not invalidate',
    );
    assert.ok(
      result.error !== undefined && result.error.length > 0,
      'expected result.error to describe the RPC failure',
    );
  });
});
