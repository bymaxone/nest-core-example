/**
 * Component tests for `StatusTiles`.
 *
 * Layer: component.
 * Goal: verify the loading state, the placeholder before the first fetch
 *   resolves, and the status chips once both statuses are known.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatusTiles } from './status-tiles'

describe('StatusTiles', () => {
  /**
   * Loading state.
   *
   * Both tiles render as loading skeletons while `loading` is true, even
   * before any status is known.
   */
  it('renders loading skeletons for both tiles when loading is true', () => {
    render(<StatusTiles liveStatus={undefined} readyStatus={undefined} loading />)
    expect(screen.getByText('Liveness')).toBeInTheDocument()
    expect(screen.getByText('Readiness')).toBeInTheDocument()
    expect(screen.queryByText('OK')).not.toBeInTheDocument()
  })

  /**
   * Placeholder before the first status is known.
   *
   * Once loading is false but a status is still undefined (an edge case
   * that should not occur once TanStack Query settles), the tile shows a
   * neutral placeholder instead of throwing.
   */
  it('renders a placeholder when a status is undefined', () => {
    render(<StatusTiles liveStatus={undefined} readyStatus={undefined} loading={false} />)
    expect(screen.getAllByText('...')).toHaveLength(2)
  })

  /**
   * Both statuses known.
   *
   * Once both statuses resolve, each tile shows its own status chip with
   * the matching severity and uppercase label.
   */
  it('renders the ok and error status chips once both statuses are known', () => {
    render(<StatusTiles liveStatus="ok" readyStatus="error" loading={false} />)
    expect(screen.getByText('OK')).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
  })
})
