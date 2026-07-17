/**
 * Component tests for `Highlights`.
 *
 * Layer: component.
 * Goal: verify the loading state (no text yet) and that all three parsed
 *   values render from a realistic scrape sample.
 * Mocks: none. Pure presentational rendering over `lib/metrics-api`'s pure
 *   parser functions.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Highlights } from './highlights'

const SAMPLE_SCRAPE = [
  'http_requests_total{method="GET",route="/catalog/products",status_code="200"} 3',
  'http_requests_total{method="POST",route="/failures/:kind",status_code="409"} 2',
  'http_request_duration_seconds_bucket{le="0.005",method="GET",route="/catalog/products",status_code="200"} 0',
  'http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/catalog/products",status_code="200"} 3',
  'catalog_lookups_total{app="nest-core-example"} 7',
].join('\n')

describe('Highlights', () => {
  /**
   * Loading state.
   *
   * Before the scrape has loaded (`text` is undefined), every tile shows
   * its loading skeleton rather than a misleading zero.
   */
  it('shows loading tiles when text is undefined', () => {
    render(<Highlights text={undefined} />)
    expect(screen.getByText('http_requests_total')).toBeInTheDocument()
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  /**
   * Parsed values.
   *
   * All three highlighted metrics render their correctly summed/counted
   * values from the raw scrape text.
   */
  it('renders the summed request total, bucket count, and lookup total', () => {
    render(<Highlights text={SAMPLE_SCRAPE} />)

    expect(screen.getByText('5')).toBeInTheDocument() // http_requests_total: 3 + 2
    expect(screen.getByText('2')).toBeInTheDocument() // duration buckets: 2 samples
    expect(screen.getByText('7')).toBeInTheDocument() // catalog_lookups_total
  })
})
