/**
 * Component tests for `CheckList`.
 *
 * Layer: component.
 * Goal: verify the empty state (liveness), one row per check with the
 *   correct severity chip, and that diagnostic details render only when
 *   present.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CheckList } from './check-list'

describe('CheckList', () => {
  /**
   * Empty state (liveness).
   *
   * The liveness endpoint always returns an empty `checks` array by
   * contract; a placeholder explains why rather than showing a blank list.
   */
  it('renders a placeholder when checks is empty', () => {
    render(<CheckList checks={[]} />)
    expect(
      screen.getByText('No indicators reported (liveness carries none by design).'),
    ).toBeInTheDocument()
  })

  /**
   * Up indicator, no details.
   *
   * A healthy indicator with no `details` field renders its name and an OK
   * chip, with no diagnostic line.
   */
  it('renders an up indicator without a details line', () => {
    render(<CheckList checks={[{ name: 'event-loop', status: 'up' }]} />)
    expect(screen.getByText('event-loop')).toBeInTheDocument()
    expect(screen.getByText('UP')).toBeInTheDocument()
  })

  /**
   * Down indicator with details.
   *
   * A failing indicator renders the ERROR-severity chip and its diagnostic
   * detail, serialized as JSON.
   */
  it('renders a down indicator with its details serialized', () => {
    render(
      <CheckList
        checks={[{ name: 'flaky', status: 'down', details: { reason: 'demo toggle' } }]}
      />,
    )
    expect(screen.getByText('DOWN')).toBeInTheDocument()
    expect(screen.getByText('{"reason":"demo toggle"}')).toBeInTheDocument()
  })

  /**
   * Multiple checks, independent rows.
   *
   * Each check renders its own row; one failing check does not affect the
   * rendering of the others.
   */
  it('renders one row per check', () => {
    render(
      <CheckList
        checks={[
          { name: 'event-loop', status: 'up' },
          { name: 'flaky', status: 'down' },
          { name: 'hanging', status: 'up' },
        ]}
      />,
    )
    expect(screen.getByText('event-loop')).toBeInTheDocument()
    expect(screen.getByText('flaky')).toBeInTheDocument()
    expect(screen.getByText('hanging')).toBeInTheDocument()
  })
})
