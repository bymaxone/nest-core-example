/**
 * @fileoverview Typed wrapper over the health surface (`./health` subpath).
 *
 * `GET /health/ready` reports `503` when any indicator is down, but that is
 * a rendered readiness state, not a transport failure: the response body is
 * still a well-formed `HealthResponse`, never an `ErrorEnvelope`. This module
 * therefore parses the body directly instead of going through the generic
 * envelope-aware `request()`, which would otherwise misclassify a 503
 * readiness response as an error because its body does not match the
 * envelope contract.
 *
 * @layer data
 */

import { env } from './env'
import { request } from './api-client'
import type { ApiResult } from './api-client'

/** One indicator's result inside a {@link HealthResponse}. */
export interface HealthCheckEntry {
  /** The indicator's unique name. */
  readonly name: string
  /** Whether the indicator is reachable and healthy. */
  readonly status: 'up' | 'down'
  /** Optional diagnostic detail, safe to render (never secrets). */
  readonly details?: Readonly<Record<string, unknown>>
}

/** The stable response body served by both health endpoints. */
export interface HealthResponse {
  /** `'ok'` when every check is up; `'error'` when any check is down. */
  readonly status: 'ok' | 'error'
  /** Every indicator's result. Empty for the liveness endpoint. */
  readonly checks: readonly HealthCheckEntry[]
}

/**
 * Narrow an unknown JSON body to a {@link HealthResponse}.
 *
 * @param value - The parsed JSON response body to check.
 * @returns Whether `value` structurally matches the health response contract.
 */
function isHealthResponse(value: unknown): value is HealthResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  const checks = candidate['checks']
  return (
    (candidate['status'] === 'ok' || candidate['status'] === 'error') &&
    Array.isArray(checks) &&
    checks.every(isHealthCheckEntry)
  )
}

/**
 * Narrow an unknown value to a {@link HealthCheckEntry}, so a malformed entry
 * (e.g. `null` or a missing name) is rejected before it reaches rendering.
 *
 * @param value - The candidate check entry.
 * @returns Whether `value` has a string `name` and an `'up' | 'down'` status.
 */
function isHealthCheckEntry(value: unknown): value is HealthCheckEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    typeof entry['name'] === 'string' && (entry['status'] === 'up' || entry['status'] === 'down')
  )
}

/**
 * Fetch a health endpoint and parse its body regardless of HTTP status.
 *
 * @param path - The health endpoint path (`/health/live` or `/health/ready`).
 * @returns The parsed health response, or a transport failure.
 */
async function fetchHealth(path: string): Promise<ApiResult<HealthResponse>> {
  let response: Response
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`)
  } catch (error) {
    return {
      ok: false,
      kind: 'transport',
      message: error instanceof Error ? error.message : 'Network request failed',
    }
  }

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

  if (!isHealthResponse(body)) {
    return {
      ok: false,
      kind: 'transport',
      message: `Unexpected health response shape (status ${String(response.status)})`,
    }
  }

  return { ok: true, data: body }
}

/**
 * Fetch liveness. Always 200 with an empty `checks` array.
 *
 * @returns The liveness response, or a transport failure.
 */
export function getLiveness(): Promise<ApiResult<HealthResponse>> {
  return fetchHealth('/health/live')
}

/**
 * Fetch readiness. 200 when every indicator is up, 503 when any is down;
 * both are valid rendered states, never a transport failure.
 *
 * @returns The readiness response, or a transport failure.
 */
export function getReadiness(): Promise<ApiResult<HealthResponse>> {
  return fetchHealth('/health/ready')
}

/** Acknowledgement of a toggle, echoing the indicator's new state. */
export interface ToggleResponse {
  /** The indicator whose state was changed. */
  readonly name: string
  /** The state now held: a readiness status for `flaky`, an armed flag for `hanging`. */
  readonly state: 'up' | 'down' | boolean
}

/**
 * Set the readiness the flaky demo indicator reports next.
 *
 * Unlike the health endpoints, this is a regular 200-or-error POST, so it
 * goes through the standard envelope-aware `request()`.
 *
 * @param status - The readiness to report on the next `GET /health/ready`.
 * @returns The toggle acknowledgement, or an API/transport failure.
 */
export function toggleFlaky(status: 'up' | 'down'): Promise<ApiResult<ToggleResponse>> {
  return request<ToggleResponse>(`/health-demo/flaky?status=${status}`, { method: 'POST' })
}

/**
 * Arm or disarm the hanging demo indicator.
 *
 * @param enabled - Whether the hanging indicator should be armed.
 * @returns The toggle acknowledgement, or an API/transport failure.
 */
export function toggleHang(enabled: boolean): Promise<ApiResult<ToggleResponse>> {
  return request<ToggleResponse>(`/health-demo/hang?enabled=${String(enabled)}`, {
    method: 'POST',
  })
}
