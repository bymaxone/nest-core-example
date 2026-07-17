/**
 * @fileoverview Typed wrapper over the Prometheus scrape endpoint, plus a
 * small text-format parser for the Metrics View's highlights panel.
 *
 * `GET /metrics` serves plain Prometheus exposition text, not JSON, so this
 * module fetches and parses it directly instead of going through the
 * JSON-only `request()` client.
 *
 * @layer data
 */

import { env } from './env'
import type { ApiResult } from './api-client'

/** One data sample parsed from the Prometheus exposition text. */
export interface MetricSample {
  /** The raw `{...}` label block, or an empty string when the metric has no labels. */
  readonly labels: string
  /** The sample's numeric value. */
  readonly value: number
}

/**
 * Matches one Prometheus exposition data line: `name{labels} value` or
 * `name value`. Comment lines (`# HELP`, `# TYPE`) never match.
 */
const METRIC_LINE_PATTERN = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+([0-9.eE+-]+)\s*$/

/**
 * Fetch the raw Prometheus scrape as plain text.
 *
 * A 404 is a valid, documented outcome (metrics disabled): it surfaces as a
 * `transport` failure with a message a caller can render as an explanatory
 * callout, not as a thrown exception.
 *
 * @returns The raw scrape text, or a transport failure.
 */
export async function getRawMetrics(): Promise<ApiResult<string>> {
  let response: Response
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}/metrics`)
  } catch (error) {
    return {
      ok: false,
      kind: 'transport',
      message: error instanceof Error ? error.message : 'Network request failed',
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: 'transport',
      message: `Metrics endpoint returned status ${String(response.status)} (metrics may be disabled)`,
    }
  }

  return { ok: true, data: await response.text() }
}

/**
 * Extract every sample for a named metric from raw exposition text.
 *
 * @param text - The raw Prometheus scrape text.
 * @param metricName - The exact metric name to match (no wildcards).
 * @returns Every matching sample, in file order.
 */
export function findMetricSamples(text: string, metricName: string): MetricSample[] {
  const samples: MetricSample[] = []
  for (const line of text.split('\n')) {
    const match = METRIC_LINE_PATTERN.exec(line)
    if (match === null) {
      continue
    }
    const [, name, labels, valueText] = match
    if (name !== metricName) {
      continue
    }
    samples.push({ labels: labels ?? '', value: Number(valueText) })
  }
  return samples
}

/**
 * Sum every sample's value for a named metric.
 *
 * Correct for a counter split across label combinations (for example
 * `http_requests_total` labeled by method/route/status): the total request
 * count is the sum across every label combination, not any single line.
 *
 * @param text - The raw Prometheus scrape text.
 * @param metricName - The exact metric name to sum.
 * @returns The summed value, `0` when the metric is absent.
 */
export function sumMetricValue(text: string, metricName: string): number {
  return findMetricSamples(text, metricName).reduce((sum, sample) => sum + sample.value, 0)
}
