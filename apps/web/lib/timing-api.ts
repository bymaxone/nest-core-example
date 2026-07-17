/**
 * @fileoverview Typed wrapper over the request-timing feed.
 *
 * `GET /timing/samples` backs both the Overview status strip (request/slow/
 * error counts) and the Latency Lab's sample feed; `POST /timing/poison`
 * arms the demo sink's one-shot failure for the Latency Lab's poison toggle.
 *
 * @layer data
 */

import { request } from './api-client'
import type { ApiResult } from './api-client'

/** A single request-timing measurement, mirroring the library's `RequestTimingSample`. */
export interface RequestTimingSample {
  /** HTTP method, for example `"GET"`. */
  readonly method: string
  /** Route template, for example `"/catalog/products/:id"` (not the raw URL). */
  readonly route: string
  /** Final HTTP status, including error statuses. */
  readonly statusCode: number
  /** Wall-clock duration from a monotonic clock, in milliseconds. */
  readonly durationMs: number
  /** Whether the sample exceeded the configured slow-request threshold. */
  readonly slow: boolean
}

/** Response body for `GET /timing/samples`. */
export interface TimingSamplesResponse {
  /** The configured slow-request threshold in ms, or undefined when unset. */
  readonly thresholdMs: number | undefined
  /** Recent request-timing samples, oldest first. */
  readonly samples: readonly RequestTimingSample[]
}

/** Response body for `POST /timing/poison`. */
export interface PoisonResponse {
  /** Always true; the next sink write will throw exactly once. */
  readonly armed: boolean
}

/**
 * Fetch the recent timing samples and the resolved slow threshold.
 *
 * @returns The samples feed, or an API/transport failure.
 */
export function getTimingSamples(): Promise<ApiResult<TimingSamplesResponse>> {
  return request<TimingSamplesResponse>('/timing/samples')
}

/**
 * Arm the demo sink's one-shot poison for the next recorded sample.
 *
 * @returns The acknowledgement, or an API/transport failure.
 */
export function poisonTimingSink(): Promise<ApiResult<PoisonResponse>> {
  return request<PoisonResponse>('/timing/poison', { method: 'POST' })
}

/** Request-count summary derived from a batch of timing samples. */
export interface TimingSummary {
  /** Total number of samples in the batch. */
  readonly total: number
  /** Number of samples flagged `slow`. */
  readonly slow: number
  /** Number of samples with an error status (`>= 400`). */
  readonly errors: number
}

/**
 * Reduce a batch of timing samples into total/slow/error counts.
 *
 * @param samples - The timing samples feed, in any order.
 * @returns The derived counts, used by the Overview status strip.
 */
export function summarizeSamples(samples: readonly RequestTimingSample[]): TimingSummary {
  return {
    total: samples.length,
    slow: samples.filter((sample) => sample.slow).length,
    errors: samples.filter((sample) => sample.statusCode >= 400).length,
  }
}
