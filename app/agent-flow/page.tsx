'use client';

import { useEffect, useMemo, useState } from 'react';
import { AgentFlowPanel } from '../components/agent-flow/agent-flow-panel';
import type { ApiActionCardProps } from '../components/agent-flow/api-action-card';

type SettlementChain = 'fast' | 'arbitrum-sepolia';

type BuyerSession = {
  sessionId: string;
  addressFast: string;
  createdAt: string;
  lastSeenAt: string;
};

type PaymentIntent = {
  intentId: string;
  buyerSessionId: string;
  serviceId: string;
  requestedAmount: string;
  settlementChain: SettlementChain;
  receiverAddress: string;
  paymentLink: string;
  paymentLinkAgent?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  sourceTxHash?: string;
  destinationTxHash?: string;
  settledAt?: string;
  deliveredAt?: string;
};

type SessionResponse = {
  session: BuyerSession;
  error?: string;
};

type CreateIntentResponse = {
  intent: PaymentIntent;
  session: BuyerSession;
  error?: string;
};

type PayIntentResponse = {
  intent: PaymentIntent;
  session: BuyerSession;
  error?: string;
};

type DeliverIntentResponse = {
  intent: PaymentIntent;
  error?: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data as T;
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function AgentFlowDemoPage() {
  const [origin, setOrigin] = useState('');
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [busyAction, setBusyAction] = useState<'create' | 'pay' | 'deliver' | null>(null);
  const [error, setError] = useState('');

  const [serviceId, setServiceId] = useState('movie tickets');
  const [amount, setAmount] = useState('2');
  const [settlementChain, setSettlementChain] = useState<SettlementChain>('fast');

  const endpoint = useMemo(() => (path: string) => (origin ? `${origin}${path}` : path), [origin]);
  const activeIntentId = intent?.intentId ?? ':intentId';

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function ensureSession(): Promise<BuyerSession> {
    const data = await fetchJson<SessionResponse>('/api/demo/session', {
      method: 'POST',
    });
    setSession(data.session);
    return data.session;
  }

  useEffect(() => {
    void ensureSession().catch((err: unknown) => {
      setError(toErrorMessage(err));
    });
  }, []);

  async function createIntent(): Promise<CreateIntentResponse> {
    setBusyAction('create');
    setError('');
    try {
      const ensuredSession = session ?? await ensureSession();
      const response = await fetchJson<CreateIntentResponse>('/api/demo/intents', {
        method: 'POST',
        body: JSON.stringify({
          buyerSessionId: ensuredSession.sessionId,
          serviceId: serviceId.trim() || 'movie tickets',
          amount: amount.trim() || '2',
          settlementChain,
        }),
      });
      setSession(response.session);
      setIntent(response.intent);
      return response;
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setBusyAction(null);
    }
  }

  async function payIntent(): Promise<PayIntentResponse> {
    if (!intent) {
      throw new Error('Create an intent first.');
    }
    setBusyAction('pay');
    setError('');
    try {
      const response = await fetchJson<PayIntentResponse>(`/api/demo/intents/${intent.intentId}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amount.trim() || intent.requestedAmount,
        }),
      });
      setSession(response.session);
      setIntent(response.intent);
      return response;
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setBusyAction(null);
    }
  }

  async function deliverIntent(): Promise<DeliverIntentResponse> {
    if (!intent) {
      throw new Error('Create an intent first.');
    }
    setBusyAction('deliver');
    setError('');
    try {
      const response = await fetchJson<DeliverIntentResponse>(`/api/demo/intents/${intent.intentId}/deliver`, {
        method: 'POST',
      });
      setIntent(response.intent);
      return response;
    } catch (err: unknown) {
      const message = toErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setBusyAction(null);
    }
  }

  const createRequestBody = {
    buyerSessionId: session?.sessionId ?? 'buyer_...',
    serviceId: serviceId.trim() || 'movie tickets',
    amount: amount.trim() || '2',
    settlementChain,
  };

  const actionCards = useMemo<ApiActionCardProps[]>(() => {
    const createSuccess = intent
      ? { intent, session: session ?? { sessionId: 'buyer_...', addressFast: '0x...' } }
      : {
          intent: {
            intentId: 'intent_...',
            status: 'pending_payment',
            paymentLink: `${endpoint('/merchant/checkout')}?intentId=intent_...`,
            paymentLinkAgent: `${endpoint('/api/pay')}?...`,
          },
          session: {
            sessionId: session?.sessionId ?? 'buyer_...',
            addressFast: session?.addressFast ?? '0x...',
          },
        };

    return [
      {
        title: 'Create Intent',
        integrationMode: 'HTTP endpoint',
        request: {
          method: 'POST',
          url: endpoint('/api/demo/intents'),
          headers: { 'Content-Type': 'application/json' },
          body: createRequestBody,
        },
        successExample: createSuccess,
        failureExamples: [
          {
            status: 400,
            payload: { error: 'Amount is required.' },
            note: 'Provide a positive decimal amount.',
          },
          {
            status: 400,
            payload: { error: 'Settlement chain must be one of: fast, arbitrum-sepolia.' },
            note: 'Use a supported settlement chain enum value.',
          },
          {
            status: 404,
            payload: { error: 'Buyer session not found. Create a session first.' },
            note: 'Create/refresh a buyer session and retry.',
          },
        ],
        environment: 'Demo APIs, testnet defaults',
        fieldNotes: [
          '`buyerSessionId` is optional when cookie session exists.',
          '`amount` must be positive decimal notation.',
        ],
        tryIt: {
          label: 'Try create intent',
          run: async () => createIntent(),
        },
      },
      {
        title: 'Pay Intent',
        integrationMode: 'HTTP endpoint',
        request: {
          method: 'POST',
          url: endpoint(`/api/demo/intents/${activeIntentId}/pay`),
          headers: { 'Content-Type': 'application/json' },
          body: { amount: amount.trim() || '2' },
        },
        successExample: {
          intent: {
            intentId: activeIntentId,
            status: intent?.status ?? 'source_paid',
            sourceTxHash: intent?.sourceTxHash ?? '0x...',
          },
          session: {
            sessionId: session?.sessionId ?? 'buyer_...',
          },
        },
        failureExamples: [
          {
            status: 400,
            payload: { error: 'Payment link expired.' },
            note: 'Create a new intent before retrying.',
          },
          {
            status: 404,
            payload: { error: 'Payment intent not found.' },
            note: 'Verify the intent ID.',
          },
        ],
        environment: 'Fast testnet sender -> receiver simulation',
        fieldNotes: [
          'Requires a real `intentId` from create intent.',
          'Verifier moves state toward `settled` after submission.',
        ],
        tryIt: intent
          ? {
              label: 'Try pay intent',
              run: async () => payIntent(),
            }
          : undefined,
      },
      {
        title: 'Deliver Intent',
        integrationMode: 'HTTP endpoint',
        request: {
          method: 'POST',
          url: endpoint(`/api/demo/intents/${activeIntentId}/deliver`),
          headers: { 'Content-Type': 'application/json' },
          body: {},
        },
        successExample: {
          intent: {
            intentId: activeIntentId,
            status: 'delivered',
            deliveredAt: intent?.deliveredAt ?? '2026-01-01T00:00:00.000Z',
          },
        },
        failureExamples: [
          {
            status: 400,
            payload: { error: 'Intent must be settled before delivery.' },
            note: 'Run payment first and wait until settled.',
          },
          {
            status: 404,
            payload: { error: 'Payment intent not found.' },
            note: 'Ensure you are using an active intent.',
          },
        ],
        environment: 'Manual service-delivery transition',
        fieldNotes: [
          'Requires settled intent state.',
          'Returns delivered intent on success.',
        ],
        tryIt: intent
          ? {
              label: 'Try deliver intent',
              run: async () => deliverIntent(),
            }
          : undefined,
      },
    ];
  }, [activeIntentId, amount, createRequestBody, endpoint, intent, session, settlementChain, serviceId]);

  return (
    <main style={{ minHeight: '100vh', padding: '7rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <header style={{ display: 'grid', gap: '0.35rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.16em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
            Demo System
          </p>
          <h1 style={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', fontWeight: 400 }}>
            Shared Agent Flow UI
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.92rem' }}>
            Reference implementation of the shared Human + Agent panel pattern from
            {' '}
            <code>demos/IMPLEMENTATION.md</code>.
          </p>
        </header>

        {error && (
          <div style={{ border: '1px solid #7f1d1d', background: '#1f1111', color: '#fca5a5', borderRadius: 8, padding: '0.8rem 0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.9rem', alignItems: 'start' }}>
          <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <header style={{ display: 'grid', gap: '0.2rem' }}>
              <h2 style={{ fontSize: '0.95rem', margin: 0 }}>Human Flow</h2>
              <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.74rem' }}>
                Manual controls that mirror the agent cards on the right.
              </p>
            </header>

            <div style={{ display: 'grid', gap: '0.45rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>Service / Product</span>
                <input
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  style={{ background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.6rem' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>Amount (SET)</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                  min="0"
                  step="any"
                  style={{ background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.6rem' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-3)' }}>Settlement Chain</span>
                <select
                  value={settlementChain}
                  onChange={(event) => setSettlementChain(event.target.value as SettlementChain)}
                  style={{ background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.6rem' }}
                >
                  <option value="fast">Fast</option>
                  <option value="arbitrum-sepolia">Arbitrum Sepolia</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              <button
                onClick={() => void createIntent()}
                disabled={busyAction !== null}
                style={{ border: 0, borderRadius: 6, padding: '0.45rem 0.75rem', background: 'var(--text)', color: 'var(--bg)', cursor: 'pointer' }}
              >
                {busyAction === 'create' ? 'Creating...' : 'Create Intent'}
              </button>
              <button
                onClick={() => void payIntent()}
                disabled={!intent || busyAction !== null}
                style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.45rem 0.75rem', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
              >
                {busyAction === 'pay' ? 'Paying...' : 'Pay Intent'}
              </button>
              <button
                onClick={() => void deliverIntent()}
                disabled={!intent || busyAction !== null}
                style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.45rem 0.75rem', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
              >
                {busyAction === 'deliver' ? 'Delivering...' : 'Deliver Intent'}
              </button>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--code-bg)', padding: '0.65rem', display: 'grid', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-2)' }}>
              <div><span style={{ color: 'var(--text-3)' }}>session:</span> {session?.sessionId ?? '—'}</div>
              <div><span style={{ color: 'var(--text-3)' }}>buyer wallet:</span> {session?.addressFast ?? '—'}</div>
              <div><span style={{ color: 'var(--text-3)' }}>intent:</span> {intent?.intentId ?? '—'}</div>
              <div><span style={{ color: 'var(--text-3)' }}>status:</span> {intent?.status ?? '—'}</div>
              <div><span style={{ color: 'var(--text-3)' }}>payment link:</span> {intent?.paymentLink ?? '—'}</div>
              <div><span style={{ color: 'var(--text-3)' }}>agent link:</span> {intent?.paymentLinkAgent ?? '—'}</div>
            </div>
          </section>

          <AgentFlowPanel
            title="Agent Flow"
            subtitle="Reusable action cards with request references, copy helpers, example responses, and optional Try-it execution."
            actions={actionCards}
          />
        </div>
      </div>
    </main>
  );
}
