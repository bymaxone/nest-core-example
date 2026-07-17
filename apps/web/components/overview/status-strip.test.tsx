/**
 * Component tests for `StatusStrip`.
 *
 * Layer: component.
 * Goal: verify the readiness placeholder before the status is known, the
 *   readiness chip once known, and the derived severity coloring on the
 *   slow/error tiles.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatusStrip } from './status-strip'

const ZERO_SUMMARY = { total: 0, slow: 0, errors: 0 }

describe('StatusStrip', () => {
  /**
   * Readiness placeholder.
   *
   * Before the readiness status is known, the readiness tile shows the
   * neutral placeholder instead of a chip.
   */
  it('renders a placeholder when healthStatus is undefined', () => {
    render(
      <StatusStrip
        healthStatus={undefined}
        summary={ZERO_SUMMARY}
        readinessLoading={false}
        timingLoading={false}
      />,
    )
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  /**
   * Readiness chip and zero-count tiles colored ok.
   *
   * Once known, the readiness tile shows its status chip. With a positive
   * request total but zero slow and zero error samples, the two derived tiles
   * both read `0` and carry the `ok` severity color, proving the `> 0` guards
   * resolve to `ok` at the boundary rather than warn/error.
   */
  it('renders the readiness chip and colors the zero slow/error tiles ok', () => {
    render(
      <StatusStrip
        healthStatus="ok"
        summary={{ total: 5, slow: 0, errors: 0 }}
        readinessLoading={false}
        timingLoading={false}
      />,
    )
    expect(screen.getByText('OK')).toBeInTheDocument()
    // Total tile shows 5; the two zeroed tiles (slow, errors) both take the ok color.
    const zeroTiles = screen.getAllByText('0')
    expect(zeroTiles).toHaveLength(2)
    for (const tile of zeroTiles) {
      expect(tile).toHaveClass('text-(--color-success)')
    }
  })

  /**
   * Non-zero slow/error tiles take warn/error colors.
   *
   * A non-zero slow count colors its tile with the warn accent and a non-zero
   * error count colors its tile with the danger color, so the severity ternaries
   * cannot collapse to a single branch or invert their comparison.
   */
  it('colors a non-zero slow tile warn and a non-zero error tile danger', () => {
    render(
      <StatusStrip
        healthStatus="error"
        summary={{ total: 10, slow: 2, errors: 3 }}
        readinessLoading={false}
        timingLoading={false}
      />,
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('2')).toHaveClass('text-(--color-accent)')
    expect(screen.getByText('3')).toHaveClass('text-(--color-danger)')
  })
})
