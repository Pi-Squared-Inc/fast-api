import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { withX402, build402Body } from '../src/middleware.js';

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

describe('build402Body()', () => {
  it('returns correct x402 response structure', () => {
    const body = build402Body(config);

    assert.equal(body.x402Version, 1);
    assert.equal(body.accepts.length, 1);
    assert.equal(body.accepts[0]?.scheme, 'exact');
    assert.equal(body.accepts[0]?.network, 'fast');
    assert.equal(body.accepts[0]?.maxAmountRequired, config.amount);
    assert.equal(body.accepts[0]?.payTo, config.recipient);
    assert.equal(body.accepts[0]?.asset, config.asset);
  });

  it('returns a plain object (not a Response)', () => {
    const body = build402Body(config);

    assert.equal(typeof body, 'object');
    assert.ok(!(body instanceof Response), 'should be a plain object, not a Response');
    assert.ok('x402Version' in body);
    assert.ok('accepts' in body);
  });
});

describe('withX402() middleware', () => {
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

  it('returns 402 when no X-PAYMENT header', async () => {
    let handlerCalled = false;

    const handler = withX402(config, (_req, _payment) => {
      handlerCalled = true;
      return Response.json({ data: 'premium' });
    });

    const req = new Request('https://example.com');
    const response = await handler(req);

    assert.equal(response.status, 402);
    assert.equal(handlerCalled, false, 'inner handler should NOT have been called');

    const body = await response.json() as {
      x402Version: number;
      accepts: Array<{
        scheme: string;
        network: string;
        maxAmountRequired: string;
        payTo: string;
        asset: string;
      }>;
    };

    assert.equal(body.x402Version, 1);
    assert.equal(body.accepts.length, 1);
    assert.equal(body.accepts[0]?.scheme, 'exact');
    assert.equal(body.accepts[0]?.network, 'fast');
    assert.equal(body.accepts[0]?.maxAmountRequired, config.amount);
    assert.equal(body.accepts[0]?.payTo, config.recipient);
    assert.equal(body.accepts[0]?.asset, config.asset);
  });

  it('calls handler when valid X-PAYMENT header', async () => {
    let handlerCalled = false;

    const handler = withX402(config, (_req, _payment) => {
      handlerCalled = true;
      return Response.json({ data: 'premium' });
    });

    const req = new Request('https://example.com', {
      headers: { 'X-PAYMENT': makeValidHeader() },
    });
    const response = await handler(req);

    assert.equal(handlerCalled, true, 'inner handler SHOULD have been called');
    assert.equal(response.status, 200);

    const body = await response.json() as { data: string };
    assert.equal(body.data, 'premium');
  });

  it('returns 402 when invalid X-PAYMENT header', async () => {
    let handlerCalled = false;

    const handler = withX402(config, (_req, _payment) => {
      handlerCalled = true;
      return Response.json({ data: 'premium' });
    });

    const req = new Request('https://example.com', {
      headers: { 'X-PAYMENT': 'garbage' },
    });
    const response = await handler(req);

    assert.equal(response.status, 402);
    assert.equal(handlerCalled, false, 'inner handler should NOT have been called');
  });

  it('passes payment result to handler', async () => {
    let capturedPayment: { valid: boolean; txHash?: string } | undefined;

    const handler = withX402(config, (_req, payment) => {
      capturedPayment = payment;
      return Response.json({ ok: true });
    });

    const req = new Request('https://example.com', {
      headers: { 'X-PAYMENT': makeValidHeader() },
    });
    await handler(req);

    assert.ok(capturedPayment !== undefined, 'handler should have received payment result');
    assert.equal(capturedPayment.valid, true);
    assert.ok(
      capturedPayment.txHash !== undefined,
      'payment.txHash should be defined',
    );
  });

  it('handles lowercase x-payment header', async () => {
    let handlerCalled = false;

    const handler = withX402(config, (_req, _payment) => {
      handlerCalled = true;
      return Response.json({ data: 'premium' });
    });

    const req = new Request('https://example.com', {
      headers: { 'x-payment': makeValidHeader() },
    });
    const response = await handler(req);

    assert.equal(handlerCalled, true, 'inner handler SHOULD have been called with lowercase header');
    assert.equal(response.status, 200);
  });
});
