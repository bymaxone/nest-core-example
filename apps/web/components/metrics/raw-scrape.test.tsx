/**
 * Component tests for `RawScrape`.
 *
 * Layer: component.
 * Goal: verify the loading placeholder, the loaded text rendering, and that
 *   the refresh button calls back and disables while refreshing.
 * Mocks: none. Pure presentational rendering with a callback prop.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { RawScrape } from './raw-scrape'

describe('RawScrape', () => {
  /**
   * Loading placeholder.
   *
   * Before the first fetch resolves (`text` is undefined), a loading
   * placeholder renders instead of an empty panel.
   */
  it('renders a loading placeholder when text is undefined', () => {
    render(<RawScrape text={undefined} onRefresh={vi.fn()} refreshing={false} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  /**
   * Loaded text.
   *
   * The raw scrape text renders verbatim inside the mono panel.
   */
  it('renders the raw scrape text once loaded', () => {
    render(<RawScrape text={'http_requests_total{} 3'} onRefresh={vi.fn()} refreshing={false} />)
    expect(screen.getByText('http_requests_total{} 3')).toBeInTheDocument()
  })

  /**
   * Refresh button.
   *
   * Clicking Refresh calls `onRefresh`; while `refreshing` is true, the
   * button shows the pending label and is disabled.
   */
  it('calls onRefresh on click and disables while refreshing', () => {
    const onRefresh = vi.fn()
    const { rerender } = render(<RawScrape text="data" onRefresh={onRefresh} refreshing={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)

    rerender(<RawScrape text="data" onRefresh={onRefresh} refreshing />)
    expect(screen.getByRole('button', { name: 'Refreshing...' })).toBeDisabled()
  })
})
