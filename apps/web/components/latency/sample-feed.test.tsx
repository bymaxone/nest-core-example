/**
 * Component tests for `SampleFeed`.
 *
 * Layer: component.
 * Goal: verify the empty state, the threshold header, most-recent-first
 *   ordering, and the slow/status badges render correctly for a batch of
 *   samples.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { SampleFeed } from './sample-feed'
import type { RequestTimingSample } from '@/lib/timing-api'

describe('SampleFeed', () => {
  /**
   * Empty state.
   *
   * With no samples yet, an action-oriented empty row renders instead of a
   * blank table body.
   */
  it('renders an empty-state row when there are no samples', () => {
    render(<SampleFeed samples={[]} thresholdMs={500} />)
    expect(screen.getByText('No samples yet. Fire a request above.')).toBeInTheDocument()
  })

  /**
   * Threshold header.
   *
   * When a threshold is configured, it renders in the header; when
   * undefined (timing disabled), the threshold line is omitted entirely.
   */
  it('renders the threshold when configured and omits it when undefined', () => {
    const { rerender } = render(<SampleFeed samples={[]} thresholdMs={500} />)
    expect(screen.getByText('slow threshold: 500ms')).toBeInTheDocument()

    rerender(<SampleFeed samples={[]} thresholdMs={undefined} />)
    expect(screen.queryByText(/slow threshold/)).not.toBeInTheDocument()
  })

  /**
   * Most-recent-first ordering and badges.
   *
   * The API returns samples oldest-first; the table must reverse them so
   * the newest request appears in the first row, and a slow sample must
   * carry the "slow" badge while a fast one does not.
   */
  it('renders samples most-recent-first with slow and status badges', () => {
    const samples: RequestTimingSample[] = [
      { method: 'GET', route: '/latency', statusCode: 200, durationMs: 10, slow: false },
      { method: 'GET', route: '/latency', statusCode: 200, durationMs: 900, slow: true },
    ]
    render(<SampleFeed samples={samples} thresholdMs={500} />)

    const rows = screen.getAllByRole('row').slice(1) // skip the header row
    expect(within(rows[0] as HTMLElement).getByText('900ms')).toBeInTheDocument()
    expect(within(rows[0] as HTMLElement).getByText('slow')).toBeInTheDocument()
    expect(within(rows[1] as HTMLElement).getByText('10ms')).toBeInTheDocument()
    expect(within(rows[1] as HTMLElement).queryByText('slow')).not.toBeInTheDocument()
  })

  /**
   * Error-status badge.
   *
   * A sample with a >= 400 status renders the destructive badge variant
   * instead of the neutral outline variant a 2xx sample gets.
   */
  it('renders a destructive badge for an error-status sample', () => {
    const samples: RequestTimingSample[] = [
      { method: 'POST', route: '/failures/:kind', statusCode: 500, durationMs: 3, slow: false },
    ]
    render(<SampleFeed samples={samples} thresholdMs={500} />)

    expect(screen.getByText('500').className).toContain('bg-destructive')
  })
})
