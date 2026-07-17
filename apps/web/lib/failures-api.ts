/**
 * @fileoverview Typed wrapper over the failure-injection surface.
 *
 * `POST /failures/:kind` always throws, one trigger per row of the library's
 * `BYMAX_*` catalog (spec §7.3) plus the unmapped-status and unknown-throw
 * fallbacks. Every call resolves through {@link request}, so a trigger's
 * outcome always surfaces as the `envelope` result variant.
 *
 * @layer data
 */

import { request } from './api-client'
import type { ApiResult } from './api-client'

/** Every demo failure kind accepted by `POST /failures/:kind`. */
export const FAILURE_KINDS = [
  'bad-request',
  'unauthorized',
  'forbidden',
  'conflict',
  'payload-too-large',
  'unsupported-media-type',
  'unprocessable',
  'too-many-requests',
  'internal',
  'not-implemented',
  'bad-gateway',
  'service-unavailable',
  'gateway-timeout',
  'teapot',
  'variant-5xx',
  'unknown',
] as const

/** One of the registered failure-injection kinds. */
export type FailureKind = (typeof FAILURE_KINDS)[number]

/**
 * Trigger the failure registered under `kind`.
 *
 * The endpoint always throws; a successful `data` result never occurs, but
 * the return type stays {@link ApiResult} so callers use the same
 * `result.ok` / `result.kind` branching as every other API wrapper.
 *
 * @param kind - The failure kind to trigger.
 * @returns The resulting error envelope, or a transport failure.
 */
export function triggerFailure(kind: FailureKind): Promise<ApiResult<never>> {
  return request<never>(`/failures/${kind}`, { method: 'POST' })
}
