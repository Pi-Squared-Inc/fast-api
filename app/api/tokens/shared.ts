import { z } from 'zod';
import { MoneyError } from '../../../dist/src/errors.js';

const Network = z.enum(['testnet', 'mainnet']);

const DiscoverBody = z.object({
  chain: z.string().min(1),
  network: Network.optional(),
});

const RegisterBody = z.object({
  chain: z.string().min(1),
  name: z.string().min(1),
  network: Network.optional(),
  address: z.string().optional(),
  mint: z.string().optional(),
  decimals: z.number().int().min(0).max(36).optional(),
});

const GetBody = z.object({
  chain: z.string().min(1),
  name: z.string().min(1),
  network: Network.optional(),
});

export type DiscoverRequest = {
  chain: string;
  network?: 'testnet' | 'mainnet';
};

export type RegisterRequest = {
  chain: string;
  name: string;
  network?: 'testnet' | 'mainnet';
  address?: string;
  mint?: string;
  decimals?: number;
};

export type GetRequest = {
  chain: string;
  name: string;
  network?: 'testnet' | 'mainnet';
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

export function parseDiscoverBody(raw: unknown): DiscoverRequest {
  const body = DiscoverBody.parse(raw);
  return {
    chain: normalizeRequired(body.chain, 'chain'),
    ...(body.network ? { network: body.network } : {}),
  };
}

export function parseRegisterBody(raw: unknown): RegisterRequest {
  const body = RegisterBody.parse(raw);
  const address = normalizeOptional(body.address);
  const mint = normalizeOptional(body.mint);
  if (!address && !mint) {
    throw new MoneyError('INVALID_PARAMS', 'Either address or mint is required.');
  }
  return {
    chain: normalizeRequired(body.chain, 'chain'),
    name: normalizeRequired(body.name, 'name').toUpperCase(),
    ...(body.network ? { network: body.network } : {}),
    ...(address ? { address } : {}),
    ...(mint ? { mint } : {}),
    ...(body.decimals !== undefined ? { decimals: body.decimals } : {}),
  };
}

export function parseGetBody(raw: unknown): GetRequest {
  const body = GetBody.parse(raw);
  return {
    chain: normalizeRequired(body.chain, 'chain'),
    name: normalizeRequired(body.name, 'name').toUpperCase(),
    ...(body.network ? { network: body.network } : {}),
  };
}

function inferStatus(err: MoneyError): number {
  if (err.code === 'INVALID_PARAMS' || err.code === 'INVALID_ADDRESS' || err.code === 'TOKEN_NOT_FOUND') {
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
