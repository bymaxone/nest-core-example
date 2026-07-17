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
})
