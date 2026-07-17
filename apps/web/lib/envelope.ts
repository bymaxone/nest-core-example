/**
 * @fileoverview Mirrored error-envelope contract from `@bymax-one/nest-core`.
 *
 * apps/web never imports the library (it is a server-side NestJS dependency):
 * this module mirrors the documented shape by hand so the dashboard can type
 * and render API error responses. `envelope.test.ts` pins every field name
 * and the full `BYMAX_*` code list against the documented contract, so any
 * drift between this mirror and the library fails loudly here rather than
 * silently misrendering in the UI.
 *
 * @layer contract
 */

/** Structured error context: an array of issues, or a keyed detail object. */
export type ErrorDetails = readonly unknown[] | Readonly<Record<string, unknown>>

/**
 * The exact shape of every error response served by the API. Field presence
 * is part of the contract:
 *
 * - `statusCode`, `code`, `message`, `timestamp`, and `path` are always present.
 * - `details` is present only when structured context exists (validation
 *   issues or, in development, the collapsed internal error).
 * - `correlationId` is present only when a correlation provider resolves one.
 */
export interface ErrorEnvelope {
  /** HTTP status code of the response. Always present. */
  readonly statusCode: number
  /** Stable machine-readable code from the `BYMAX_*` catalog, or a passed-through domain code. Always present. */
  readonly code: string
  /** Human-readable message, safe to show end users. Always present. */
  readonly message: string
  /** Structured context, such as validation issues. Present only when it exists. */
  readonly details?: ErrorDetails
  /** Correlation id for the current request. Present only when a provider resolves one. */
  readonly correlationId?: string
  /** ISO 8601 instant the error was formatted. Always present. */
  readonly timestamp: string
  /** Request URL path. Always present. */
  readonly path: string
}

/**
 * The stable `BYMAX_*` error-code catalog exported by `@bymax-one/nest-core`.
 *
 * This is 16 distinct codes covering the library's 17 documented catalog
 * derivations (spec §7.3, rows 20-36): row 36 (an uncatalogued 5xx status)
 * shares `BYMAX_INTERNAL_ERROR` with row 30, so the derivation count is one
 * higher than the distinct-code count.
 */
export const BYMAX_ERROR_CODES = [
  'BYMAX_BAD_REQUEST',
  'BYMAX_VALIDATION_FAILED',
  'BYMAX_UNAUTHORIZED',
  'BYMAX_FORBIDDEN',
  'BYMAX_NOT_FOUND',
  'BYMAX_CONFLICT',
  'BYMAX_PAYLOAD_TOO_LARGE',
  'BYMAX_UNSUPPORTED_MEDIA_TYPE',
  'BYMAX_UNPROCESSABLE_ENTITY',
  'BYMAX_TOO_MANY_REQUESTS',
  'BYMAX_CLIENT_ERROR',
  'BYMAX_INTERNAL_ERROR',
  'BYMAX_NOT_IMPLEMENTED',
  'BYMAX_BAD_GATEWAY',
  'BYMAX_SERVICE_UNAVAILABLE',
  'BYMAX_GATEWAY_TIMEOUT',
] as const

/** One of the library's stable `BYMAX_*` error codes. */
export type BymaxErrorCode = (typeof BYMAX_ERROR_CODES)[number]

/**
 * Narrow an unknown JSON body to an {@link ErrorEnvelope}.
 *
 * Checks every always-present field's type; `details`, `correlationId` are
 * not required since the contract allows either to be absent. Does not
 * require `code` to be one of {@link BYMAX_ERROR_CODES}: domain errors (for
 * example `CATALOG_OUT_OF_SEASON`) pass an explicit code through verbatim,
 * so a caller-supplied code is a valid envelope too.
 *
 * @param value - The parsed JSON response body to check.
 * @returns Whether `value` structurally matches the envelope contract.
 */
export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate['statusCode'] === 'number' &&
    typeof candidate['code'] === 'string' &&
    typeof candidate['message'] === 'string' &&
    typeof candidate['timestamp'] === 'string' &&
    typeof candidate['path'] === 'string'
  )
}
