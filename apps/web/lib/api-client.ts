/**
 * @fileoverview Envelope-aware typed fetch wrapper over apps/api.
 *
 * Every feature-specific `lib/*-api.ts` module calls `request<T>()` instead
 * of `fetch` directly. The wrapper never throws: every outcome (success,
 * documented error envelope, or a transport failure such as a network error
 * or a non-JSON body) is represented in the returned discriminated union, so
 * callers branch on `result.ok` / `result.kind` instead of try/catch.
 *
 * @layer data
 */

import { env } from './env'
import { isErrorEnvelope, type ErrorEnvelope } from './envelope'

/** Successful response: the parsed, typed body. */
interface ApiSuccess<T> {
  readonly ok: true
  readonly data: T
}

/** The API responded with a documented {@link ErrorEnvelope}. */
interface ApiEnvelopeError {
  readonly ok: false
  readonly kind: 'envelope'
  readonly error: ErrorEnvelope
}

/**
 * The request failed before or outside the envelope contract: a network
 * error, an aborted request, or a non-JSON / non-envelope error body.
 */
interface ApiTransportError {
  readonly ok: false
  readonly kind: 'transport'
  readonly message: string
}

/** The result of an `request<T>()` call: success, a mapped envelope, or a transport failure. */
export type ApiResult<T> = ApiSuccess<T> | ApiEnvelopeError | ApiTransportError

/** Response header carrying the correlation id, echoed by the API's request-context middleware. */
const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Fill in `correlationId` from the response's `x-request-id` header when the
 * envelope body did not already carry one.
 *
 * @param envelope - The parsed error envelope.
 * @param requestId - The `x-request-id` response header value, or `null`.
 * @returns The envelope unchanged, or with `correlationId` filled in.
 */
function withRequestId(envelope: ErrorEnvelope, requestId: string | null): ErrorEnvelope {
  if (envelope.correlationId !== undefined || requestId === null) {
    return envelope
  }
  return { ...envelope, correlationId: requestId }
}

/**
 * Call the API and return a typed, envelope-aware result.
 *
 * Never throws. Network failures and non-JSON bodies surface as the
 * `transport` variant; a documented error envelope surfaces as the
 * `envelope` variant with its `correlationId` backfilled from the
 * `x-request-id` header when the body omitted it; anything else resolves as
 * `data: T`.
 *
 * @param path - Path appended to `NEXT_PUBLIC_API_URL` (must start with `/`).
 * @param init - Standard `fetch` options (method, headers, body, ...).
 * @returns The discriminated {@link ApiResult}.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, init)
  } catch (error) {
    return {
      ok: false,
      kind: 'transport',
      message: error instanceof Error ? error.message : 'Network request failed',
    }
  }

  const requestId = response.headers.get(REQUEST_ID_HEADER)

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return {
      ok: false,
      kind: 'transport',
      message: `Response was not valid JSON (status ${String(response.status)})`,
    }
  }

  if (!response.ok) {
    if (isErrorEnvelope(body)) {
      return { ok: false, kind: 'envelope', error: withRequestId(body, requestId) }
    }
    return {
      ok: false,
      kind: 'transport',
      message: `Unexpected error response shape (status ${String(response.status)})`,
    }
  }

  return { ok: true, data: body as T }
}
