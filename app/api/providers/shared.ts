import { z } from 'zod';
import { MoneyError } from '../../../dist/src/errors.js';

const Network = z.enum(['testnet', 'mainnet']);

const SetApiKeyBody = z.object({
  provider: z.string().min(1),
  apiKey: z.string().min(1),
});

const QuoteTestBody = z.object({
  operation: z.literal('quote'),
  chain: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  amount: z.union([z.string(), z.number()]),
  network: Network.default('mainnet'),
  slippageBps: z.number().int().min(1).max(5000).optional(),
  provider: z.string().optional(),
});

const PriceTestBody = z.object({
  operation: z.literal('price'),
  token: z.string().min(1),
  chain: z.string().optional(),
  provider: z.string().optional(),
});

const ProviderTestBody = z.discriminatedUnion('operation', [QuoteTestBody, PriceTestBody]);

export type SetApiKeyRequest = {
  provider: string;
  apiKey: string;
};

export type QuoteTestRequest = {
  operation: 'quote';
  chain: string;
  from: string;
  to: string;
  amount: string | number;
  network: 'testnet' | 'mainnet';
  slippageBps?: number;
  provider?: string;
};

export type PriceTestRequest = {
  operation: 'price';
  token: string;
  chain?: string;
  provider?: string;
};

export type ProviderTestRequest = QuoteTestRequest | PriceTestRequest;

function normalizeRequiredString(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new MoneyError('INVALID_PARAMS', `${field} is required.`);
  }
  return trimmed;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeAmount(value: string | number): string | number {
  const raw = typeof value === 'number' ? value.toString() : value.trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new MoneyError('INVALID_PARAMS', 'amount must be a positive number.');
  }
  return typeof value === 'number' ? value : raw;
}

export function parseSetApiKeyBody(raw: unknown): SetApiKeyRequest {
  const body = SetApiKeyBody.parse(raw);
  return {
    provider: normalizeRequiredString(body.provider, 'provider'),
    apiKey: normalizeRequiredString(body.apiKey, 'apiKey'),
  };
}

export function parseProviderTestBody(raw: unknown): ProviderTestRequest {
  const body = ProviderTestBody.parse(raw);
  if (body.operation === 'quote') {
    return {
      operation: 'quote',
      chain: normalizeRequiredString(body.chain, 'chain'),
      from: normalizeRequiredString(body.from, 'from'),
      to: normalizeRequiredString(body.to, 'to'),
      amount: normalizeAmount(body.amount),
      network: body.network,
      ...(body.slippageBps !== undefined ? { slippageBps: body.slippageBps } : {}),
      ...(normalizeOptionalString(body.provider) ? { provider: normalizeOptionalString(body.provider) } : {}),
    };
  }

  return {
    operation: 'price',
    token: normalizeRequiredString(body.token, 'token'),
    ...(normalizeOptionalString(body.chain) ? { chain: normalizeOptionalString(body.chain) } : {}),
    ...(normalizeOptionalString(body.provider) ? { provider: normalizeOptionalString(body.provider) } : {}),
  };
}

function inferStatusCode(err: MoneyError): number {
  if (err.code === 'INVALID_PARAMS' || err.code === 'INVALID_ADDRESS' || err.code === 'UNSUPPORTED_OPERATION') {
    return 400;
  }
  if (err.code === 'CHAIN_NOT_CONFIGURED') {
    return 409;
  }
  return 500;
}

export function toExecutionError(err: unknown): { message: string; code?: string; note?: string } {
  if (err instanceof MoneyError) {
    return {
      message: err.message,
      code: err.code,
      ...(err.note ? { note: err.note } : {}),
    };
  }
  if (err instanceof z.ZodError) {
    return {
      message: 'Invalid request payload.',
      code: 'INVALID_PARAMS',
    };
  }
  return {
    message: err instanceof Error ? err.message : 'Unexpected server error.',
    code: 'INTERNAL_ERROR',
  };
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof z.ZodError) {
    return Response.json(
      { error: 'Invalid request payload.', code: 'INVALID_PARAMS', details: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof MoneyError) {
    return Response.json(
      {
        error: err.message,
        code: err.code,
        note: err.note,
      },
      { status: inferStatusCode(err) },
    );
  }
  const message = err instanceof Error ? err.message : 'Unexpected server error.';
  return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
}
