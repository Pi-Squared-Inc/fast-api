/**
 * errors.ts — Structured error codes for x402 server middleware.
 */

export type X402ErrorCode =
  | 'INVALID_HEADER'
  | 'INVALID_VERSION'
  | 'VERIFICATION_FAILED'
  | 'NETWORK_ERROR';

export class X402Error extends Error {
  readonly code: X402ErrorCode;
  readonly note: string;

  constructor(
    code: X402ErrorCode,
    message: string,
    opts?: { note?: string },
  ) {
    super(message);
    this.name = 'X402Error';
    this.code = code;
    this.note = opts?.note ?? '';
  }

  toJSON(): Record<string, unknown> {
    return {
      error: true,
      code: this.code,
      message: this.message,
      note: this.note,
    };
  }
}
