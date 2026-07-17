/**
 * Component tests for `DurationSparkline`.
 *
 * Layer: component.
 * Goal: verify the empty state, the trailing-50-samples cap, and the
 *   single-sample edge case (which would divide by zero without the
 *   `Math.max(lastIndex, 1)` guard).
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DurationSparkline } from './duration-sparkline'
import type { RequestTimingSample } from '@/lib/timing-api'

/** Builds `count` synthetic samples with increasing duration. */
function buildSamples(count: number): RequestTimingSample[] {
  return Array.from({ length: count }, (_value, index) => ({
    method: 'GET',
    route: '/latency',
    statusCode: 200,
    durationMs: index + 1,
    slow: false,
  }))
}

describe('DurationSparkline', () => {
  /**
   * Empty state.
   *
   * With no samples, a text placeholder renders instead of an empty SVG.
   */
  it('renders a placeholder when there are no samples', () => {
    render(<DurationSparkline samples={[]} />)
    expect(screen.getByText('No samples yet.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  /**
   * Single-sample edge case.
   *
   * One sample must render without throwing (guards the division-by-zero
   * case in the x-position formula) and label itself accordingly.
   */
  it('renders a single-point sparkline without throwing', () => {
    render(<DurationSparkline samples={buildSamples(1)} />)
    expect(screen.getByLabelText('Duration sparkline of the last 1 samples')).toBeInTheDocument()
  })

  /**
   * Trailing-50 cap.
   *
   * Given more than 50 samples, only the last 50 are plotted; the label
   * pins the cap so a regression that plots every sample is caught.
   */
  it('caps the plotted samples at the last 50', () => {
    render(<DurationSparkline samples={buildSamples(120)} />)
    expect(screen.getByLabelText('Duration sparkline of the last 50 samples')).toBeInTheDocument()
  })

  /**
   * Exact normalized geometry.
   *
   * Durations chosen to divide the height cleanly (0, 24, 48 against a max of
   * 48) pin the full `points` string and the `viewBox`: x is spread evenly
   * across the width, y is the height minus the max-normalized duration, and
   * the tallest sample touches the top edge (y=0). This fixes every step of
   * the coordinate math against regression.
   */
  it('emits exact normalized coordinates for a known batch', () => {
    const durations = [0, 24, 48]
    const samples: RequestTimingSample[] = durations.map((durationMs, index) => ({
      method: 'GET',
      route: '/latency',
      statusCode: 200,
      durationMs,
      slow: index === durations.length - 1,
    }))

    const { container } = render(<DurationSparkline samples={samples} />)

    expect(container.querySelector('polyline')?.getAttribute('points')).toBe('0,48 150,24 300,0')
    expect(screen.getByRole('img').getAttribute('viewBox')).toBe('0 0 300 48')
  })
})
