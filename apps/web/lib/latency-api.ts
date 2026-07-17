/**
 * @fileoverview Typed wrapper over the artificial-delay endpoint.
 *
 * `GET /latency?ms=&poison=` awaits the requested, clamped delay and reports
 * the actual elapsed time, driving the Latency Lab's delay control and the
 * sink-poison proof.
 *
 * @layer data
 */

import { request } from './api-client'
import type { ApiResult } from './api-client'

/** Response body for `GET /latency`. */
export interface LatencyResponse {
  /** The clamped delay that was requested, in milliseconds. */
  readonly requestedMs: number
  /** The actual wall-clock time the handler took to resolve, in milliseconds. */
  readonly elapsedMs: number
  /** Whether this request armed the one-shot sink poison. */
  readonly poisoned: boolean
}

/**
 * Fire a delayed request, optionally arming the sink poison.
 *
 * @param ms - Requested delay in milliseconds; the API clamps it to `[0, 5000]`.
 * @param poison - When true, arms the demo sink's one-shot poison for this request.
 * @returns The requested delay, the measured elapsed time, and the poison flag.
 */
export function fireDelay(ms: number, poison = false): Promise<ApiResult<LatencyResponse>> {
  const params = new URLSearchParams({ ms: String(ms) })
  if (poison) {
    params.set('poison', 'true')
  }
  return request<LatencyResponse>(`/latency?${params.toString()}`)
}
