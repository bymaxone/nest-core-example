/**
 * Component tests for `StatTile`.
 *
 * Layer: component.
 * Goal: verify the label/value/hint rendering, the loading skeleton branch,
 *   and severity-driven value coloring.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatTile } from './stat-tile'

describe('StatTile', () => {
  /**
   * Base rendering.
   *
   * Label, value, and an optional hint all render as passed.
   */
  it('renders the label, value, and hint', () => {
    render(<StatTile label="Requests" value={42} hint="last 3s" />)
    expect(screen.getByText('Requests')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('last 3s')).toBeInTheDocument()
  })

  /**
   * No hint.
   *
   * When `hint` is omitted, no empty hint line is rendered.
   */
  it('renders without a hint line when hint is not provided', () => {
    render(<StatTile label="Requests" value={42} />)
    expect(screen.queryByText('last 3s')).not.toBeInTheDocument()
  })

  /**
   * Loading branch.
   *
   * While `loading` is true, a skeleton placeholder replaces the value so
   * the tile never shows a stale or zero value during the first fetch.
   */
  it('renders a loading skeleton instead of the value when loading is true', () => {
    render(<StatTile label="Requests" value={42} loading />)
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  /**
   * Severity coloring.
   *
   * An `error` severity paints the value with the error text class from the
   * shared severity mapping.
   */
  it('applies the error severity text class to the value', () => {
    render(<StatTile label="Errors" value={3} severity="error" />)
    expect(screen.getByText('3').className).toContain('text-(--color-danger)')
  })
})
