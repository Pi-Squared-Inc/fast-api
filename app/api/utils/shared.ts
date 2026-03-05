import { z } from 'zod';
import { MoneyError } from '../../../dist/src/errors.js';

const Network = z.enum(['testnet', 'mainnet']);

const IdentifyBody = z.object({
  address: z.string().min(1),
});

const ToRawBody = z.object({
  amount: z.union([z.string(), z.number()]),
  chain: z.string().optional(),
  network: Network.optional(),
  token: z.string().optional(),
  decimals: z.number().int().min(0).max(255).optional(),
});

const ToHumanBody = z.object({
  amount: z.union([z.string(), z.number()]),
  chain: z.string().optional(),
  network: Network.optional(),
  token: z.string().optional(),
  decimals: z.number().int().min(0).max(255).optional(),
});

export type IdentifyRequest = {
  address: string;
};

export type ToRawRequest = {
  amount: string | number;
  chain?: string;
  network?: 'testnet' | 'mainnet';
  token?: string;
  decimals?: number;
};

export type ToHumanRequest = {
  amount: string | number;
  chain?: string;
  network?: 'testnet' | 'mainnet';
  token?: string;
  decimals?: number;
};

function normalizeRequired(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new MoneyError('INVALID_PARAMS', `${field} is required.`);
  }
  return trimmed;
}

function normalizeOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeAmount(value: string | number): string | number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new MoneyError('INVALID_PARAMS', 'amount must be a finite number.');
    }
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new MoneyError('INVALID_PARAMS', 'amount is required.');
  }
  return trimmed;
}

export function parseIdentifyBody(raw: unknown): IdentifyRequest {
  const body = IdentifyBody.parse(raw);
  return {
    address: normalizeRequired(body.address, 'address'),
  };
}

export function parseToRawBody(raw: unknown): ToRawRequest {
  const body = ToRawBody.parse(raw);
  const chain = normalizeOptional(body.chain);
  const token = normalizeOptional(body.token);
  return {
    amount: normalizeAmount(body.amount),
    ...(chain ? { chain } : {}),
    ...(body.network ? { network: body.network } : {}),
    ...(token ? { token } : {}),
    ...(body.decimals !== undefined ? { decimals: body.decimals } : {}),
  };
}

export function parseToHumanBody(raw: unknown): ToHumanRequest {
  const body = ToHumanBody.parse(raw);
  const chain = normalizeOptional(body.chain);
  const token = normalizeOptional(body.token);
  return {
    amount: normalizeAmount(body.amount),
    ...(chain ? { chain } : {}),
    ...(body.network ? { network: body.network } : {}),
    ...(token ? { token } : {}),
    ...(body.decimals !== undefined ? { decimals: body.decimals } : {}),
  };
}

function inferStatus(err: MoneyError): number {
  if (err.code === 'INVALID_PARAMS' || err.code === 'INVALID_ADDRESS' || err.code === 'TOKEN_NOT_FOUND' || err.code === 'UNSUPPORTED_OPERATION') {
    return 400;
  }
  if (err.code === 'CHAIN_NOT_CONFIGURED') {
    return 409;
  }
  return 500;
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof z.ZodError) {
    return Response.json(
      {
        error: 'Invalid request payload.',
        code: 'INVALID_PARAMS',
        details: err.flatten(),
      },
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
      { status: inferStatus(err) },
    );
  }
  const message = err instanceof Error ? err.message : 'Unexpected server error.';
  return Response.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
}
