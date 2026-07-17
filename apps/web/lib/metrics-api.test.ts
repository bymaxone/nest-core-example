/**
 * Unit tests for the metrics wrapper and Prometheus text parser.
 *
 * Layer: unit.
 * Goal: verify `getRawMetrics` handles success, a disabled-metrics 404, a
 *   non-JSON-relevant network failure, and that `findMetricSamples` /
 *   `sumMetricValue` correctly parse comment lines, labeled samples, and
 *   `+Inf` histogram bucket labels from real-shaped exposition text.
 * Mocks: `global.fetch`, restored after every test.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { findMetricSamples, getRawMetrics, sumMetricValue } from './metrics-api'

/** A realistic slice of Prometheus exposition text, mirroring the API's real scrape. */
const SAMPLE_SCRAPE = [
  '# HELP http_requests_total Total number of completed HTTP requests.',
  '# TYPE http_requests_total counter',
  'http_requests_total{method="GET",route="/catalog/products",status_code="200",app="nest-core-example"} 3',
  'http_requests_total{method="POST",route="/failures/:kind",status_code="409",app="nest-core-example"} 2',
  '',
  '# HELP http_request_duration_seconds HTTP request duration in seconds.',
  '# TYPE http_request_duration_seconds histogram',
  'http_request_duration_seconds_bucket{le="0.005",app="nest-core-example",method="GET",route="/catalog/products",status_code="200"} 0',
  'http_request_duration_seconds_bucket{le="+Inf",app="nest-core-example",method="GET",route="/catalog/products",status_code="200"} 3',
  '',
  '# HELP catalog_lookups_total Total catalog lookups performed through the metrics demo endpoint.',
  '# TYPE catalog_lookups_total counter',
  'catalog_lookups_total{app="nest-core-example"} 5',
].join('\n')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getRawMetrics', () => {
  /**
   * Successful scrape.
   *
   * A 200 response's body text is returned verbatim.
   */
  it('returns the raw scrape text on a successful response', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve(SAMPLE_SCRAPE) }),
    )

    // Act
    const result = await getRawMetrics()

    // Assert
    expect(result).toEqual({ ok: true, data: SAMPLE_SCRAPE })
  })

  /**
   * Disabled metrics (404).
   *
   * A 404 is the documented outcome when `METRICS_ENABLED=false`; it
   * surfaces as a transport failure with an explanatory message, never a
   * thrown exception.
   */
  it('returns a transport failure explaining a 404 as metrics possibly disabled', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('') }),
    )

    // Act
    const result = await getRawMetrics()

    // Assert
    expect(result).toEqual({
      ok: false,
      kind: 'transport',
      message: 'Metrics endpoint returned status 404 (metrics may be disabled)',
    })
  })

  /**
   * Network failure.
   *
   * A rejected `fetch` never throws out of `getRawMetrics`.
   */
  it('returns kind:transport when fetch rejects', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    // Act
    const result = await getRawMetrics()

    // Assert
    expect(result).toEqual({ ok: false, kind: 'transport', message: 'Failed to fetch' })
  })

  /**
   * Network failure with a non-Error rejection.
   *
   * Mirrors the api-client's fallback-message behavior.
   */
  it('falls back to a generic message when fetch rejects with a non-Error value', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'))

    // Act
    const result = await getRawMetrics()

    // Assert
    expect(result).toEqual({ ok: false, kind: 'transport', message: 'Network request failed' })
  })
})

describe('findMetricSamples', () => {
  /**
   * Multiple labeled samples.
   *
   * Every line for the named metric is extracted, HELP/TYPE comments and
   * unrelated metrics are skipped, and each sample's label block and value
   * are captured.
   */
  it('extracts every labeled sample for the named metric, skipping comments', () => {
    const samples = findMetricSamples(SAMPLE_SCRAPE, 'http_requests_total')

    expect(samples).toEqual([
      {
        labels:
          '{method="GET",route="/catalog/products",status_code="200",app="nest-core-example"}',
        value: 3,
      },
      {
        labels: '{method="POST",route="/failures/:kind",status_code="409",app="nest-core-example"}',
        value: 2,
      },
    ])
  })

  /**
   * `+Inf` bucket label.
   *
   * A histogram's `+Inf` bucket line must parse correctly: the `+` inside
   * the label block must not be mistaken for part of the numeric value.
   */
  it('parses a histogram bucket line with the +Inf label', () => {
    const samples = findMetricSamples(SAMPLE_SCRAPE, 'http_request_duration_seconds_bucket')

    expect(samples).toHaveLength(2)
    expect(samples[1]).toEqual({
      labels:
        '{le="+Inf",app="nest-core-example",method="GET",route="/catalog/products",status_code="200"}',
      value: 3,
    })
  })

  /**
   * Absent metric.
   *
   * A metric name that never appears in the text returns an empty array,
   * not an error.
   */
  it('returns an empty array when the metric is absent', () => {
    expect(findMetricSamples(SAMPLE_SCRAPE, 'nonexistent_metric_total')).toEqual([])
  })

  /**
   * Unlabeled metric line.
   *
   * A metric with no `{...}` label block (for example a process gauge)
   * must still parse, with `labels` defaulting to an empty string rather
   * than `undefined`.
   */
  it('defaults labels to an empty string for an unlabeled metric line', () => {
    const samples = findMetricSamples(
      'process_start_time_seconds 1737100000',
      'process_start_time_seconds',
    )
    expect(samples).toEqual([{ labels: '', value: 1737100000 }])
  })
})

describe('sumMetricValue', () => {
  /**
   * Sum across label combinations.
   *
   * `http_requests_total` is split across method/route/status; the total
   * request count is the sum of every line, not any single one.
   */
  it('sums every labeled sample for a multi-label counter', () => {
    expect(sumMetricValue(SAMPLE_SCRAPE, 'http_requests_total')).toBe(5)
  })

  /**
   * Single unlabeled-by-caller counter.
   *
   * `catalog_lookups_total` carries only the default `app` label; the sum
   * equals its single value.
   */
  it('returns the single value for a single-sample counter', () => {
    expect(sumMetricValue(SAMPLE_SCRAPE, 'catalog_lookups_total')).toBe(5)
  })

  /**
   * Absent metric sums to zero.
   *
   * Protects the Metrics View highlights panel from rendering `NaN` before
   * the custom counter has ever been incremented.
   */
  it('returns 0 for an absent metric', () => {
    expect(sumMetricValue(SAMPLE_SCRAPE, 'nonexistent_metric_total')).toBe(0)
  })
})
