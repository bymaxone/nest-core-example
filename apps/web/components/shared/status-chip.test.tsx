/**
 * Component tests for `StatusChip`.
 *
 * Layer: component.
 * Goal: verify the default label per severity and the label-override prop.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatusChip } from './status-chip'

describe('StatusChip', () => {
  /**
   * Default label per severity.
   *
   * Without a `label` override, each severity renders its own default text
   * (`OK`/`WARN`/`ERROR`) from the shared severity mapping.
   */
  it.each([
    ['ok', 'OK'],
    ['warn', 'WARN'],
    ['error', 'ERROR'],
  ] as const)('renders the default label %s for severity %s', (severity, expectedLabel) => {
    render(<StatusChip severity={severity} />)
    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
  })

  /**
   * Label override.
   *
   * A caller-supplied `label` (for example the readiness status text)
   * replaces the severity's default label entirely.
   */
  it('renders the custom label instead of the default when provided', () => {
    render(<StatusChip severity="error" label="DOWN" />)
    expect(screen.getByText('DOWN')).toBeInTheDocument()
    expect(screen.queryByText('ERROR')).not.toBeInTheDocument()
  })
})
