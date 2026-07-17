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
   * Readiness chip and zero-count tiles.
   *
   * Once known, the readiness tile shows its status chip; with zero
   * requests, slow, and error samples, all three timing tiles render 0.
   */
  it('renders the readiness chip and zero-count tiles as ok', () => {
    render(
      <StatusStrip
        healthStatus="ok"
        summary={ZERO_SUMMARY}
        readinessLoading={false}
        timingLoading={false}
      />,
    )
    expect(screen.getByText('OK')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(3)
  })

  /**
   * Non-zero slow/error tiles.
   *
   * A non-zero slow or error count renders its warn/error-severity value
   * instead of the ok treatment.
   */
  it('renders non-zero slow and error counts', () => {
    render(
      <StatusStrip
        healthStatus="error"
        summary={{ total: 10, slow: 2, errors: 3 }}
        readinessLoading={false}
        timingLoading={false}
      />,
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
