import { z } from 'zod';
import { MoneyError } from '../../../dist/src/errors.js';

export const ErrorScenarioId = z.enum([
  'chain_not_configured',
  'invalid_address',
  'insufficient_balance',
  'unsupported_operation',
  'invalid_params',
]);

const Mode = z.enum(['fail', 'recover']).default('fail');

const RunScenarioBody = z.object({
  scenarioId: ErrorScenarioId,
  mode: Mode.optional(),
});

export type ScenarioId = z.infer<typeof ErrorScenarioId>;

export type RunScenarioRequest = {
  scenarioId: ScenarioId;
  mode: 'fail' | 'recover';
};

export type SerializedMoneyError = {
  code?: string;
  message: string;
  note?: string;
  chain?: string;
  details?: Record<string, unknown>;
};

export function parseRunScenarioBody(raw: unknown): RunScenarioRequest {
  const body = RunScenarioBody.parse(raw);
  return {
    scenarioId: body.scenarioId,
    mode: body.mode ?? 'fail',
  };
}

export function serializeError(err: unknown): SerializedMoneyError {
  if (err instanceof MoneyError) {
    return {
      code: err.code,
      message: err.message,
      note: err.note,
      ...(err.chain ? { chain: err.chain } : {}),
      ...(err.details ? { details: err.details } : {}),
    };
  }
  return {
    code: 'INTERNAL_ERROR',
    message: err instanceof Error ? err.message : 'Unexpected server error.',
  };
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
  return Response.json(
    {
      error: err instanceof Error ? err.message : 'Unexpected server error.',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 },
  );
}
