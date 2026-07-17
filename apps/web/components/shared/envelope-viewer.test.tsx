/**
 * Component tests for `EnvelopeViewer`.
 *
 * Layer: component.
 * Goal: verify every present field renders, absent optional fields are
 *   omitted, the correlationId row is visually highlighted, and the copy
 *   button copies the full JSON to the clipboard.
 * Mocks: `navigator.clipboard.writeText`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { EnvelopeViewer } from './envelope-viewer'
import type { ErrorEnvelope } from '@/lib/envelope'

const FULL_ENVELOPE: ErrorEnvelope = {
  statusCode: 409,
  code: 'BYMAX_CONFLICT',
  message: 'Demo conflict failure',
  details: { reason: 'duplicate' },
  correlationId: 'req-123',
  timestamp: '2026-01-01T00:00:00.000Z',
  path: '/failures/conflict',
}

const MINIMAL_ENVELOPE: ErrorEnvelope = {
  statusCode: 404,
  code: 'BYMAX_NOT_FOUND',
  message: 'Product p-999999 was not found',
  timestamp: '2026-01-01T00:00:00.000Z',
  path: '/catalog/products/p-999999',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('EnvelopeViewer', () => {
  /**
   * Full envelope.
   *
   * Every field, including the optional `details` and `correlationId`,
   * renders as its own annotated row.
   */
  it('renders every present field of a full envelope', () => {
    render(<EnvelopeViewer envelope={FULL_ENVELOPE} />)

    expect(screen.getByText('"statusCode"')).toBeInTheDocument()
    expect(screen.getByText('"code"')).toBeInTheDocument()
    expect(screen.getByText('"message"')).toBeInTheDocument()
    expect(screen.getByText('"details"')).toBeInTheDocument()
    expect(screen.getByText('"correlationId"')).toBeInTheDocument()
    expect(screen.getByText('"timestamp"')).toBeInTheDocument()
    expect(screen.getByText('"path"')).toBeInTheDocument()
    // The code value renders with a trailing comma (it is not the last
    // field), so it matches by substring rather than an exact string.
    expect(screen.getByText(/"BYMAX_CONFLICT"/)).toBeInTheDocument()
  })

  /**
   * Minimal envelope.
   *
   * `details` and `correlationId` are documented as optional; when absent,
   * their rows must not render at all (not even empty rows).
   */
  it('omits the details and correlationId rows when absent', () => {
    render(<EnvelopeViewer envelope={MINIMAL_ENVELOPE} />)

    expect(screen.queryByText('"details"')).not.toBeInTheDocument()
    expect(screen.queryByText('"correlationId"')).not.toBeInTheDocument()
    expect(screen.getByText('"statusCode"')).toBeInTheDocument()
  })

  /**
   * correlationId highlight.
   *
   * The correlationId row carries the highlight background class so it
   * reads as visually distinct from the other fields.
   */
  it('highlights the correlationId row when present', () => {
    render(<EnvelopeViewer envelope={FULL_ENVELOPE} />)

    const row = screen.getByText('"correlationId"').closest('div')
    expect(row?.className).toContain('bg-(--color-primary-20)')
  })

  /**
   * Copy button.
   *
   * Clicking the copy button writes the full, pretty-printed JSON to the
   * clipboard and briefly swaps the icon to a checkmark.
   */
  it('copies the full envelope JSON to the clipboard on click', async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<EnvelopeViewer envelope={MINIMAL_ENVELOPE} />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Copy envelope JSON' }))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled())

    // Assert
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(MINIMAL_ENVELOPE, null, 2))
  })

  /**
   * Copy-icon swap.
   *
   * After a successful copy, the button's icon switches from the copy glyph
   * to a checkmark, giving the user visual confirmation.
   */
  it('swaps the button icon to a checkmark after a successful copy', async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<EnvelopeViewer envelope={MINIMAL_ENVELOPE} />)
    const button = screen.getByRole('button', { name: 'Copy envelope JSON' })

    // Act
    fireEvent.click(button)

    // Assert
    await vi.waitFor(() => expect(button.querySelector('.lucide-check')).not.toBeNull())
  })

  /**
   * Checkmark reverts after the timeout.
   *
   * The checkmark is a transient confirmation: 1500ms after a copy, the
   * icon must revert to the copy glyph so a second copy is visually
   * distinguishable from the first.
   */
  it('reverts the icon to the copy glyph 1500ms after copying', async () => {
    // Arrange
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<EnvelopeViewer envelope={MINIMAL_ENVELOPE} />)
    const button = screen.getByRole('button', { name: 'Copy envelope JSON' })

    // Act
    fireEvent.click(button)
    // Flush the resolved clipboard promise's microtask queue before the
    // checkmark assertion; fake timers do not advance real microtasks.
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(button.querySelector('.lucide-check')).not.toBeNull()
    await act(() => vi.advanceTimersByTimeAsync(1500))

    // Assert
    expect(button.querySelector('.lucide-copy')).not.toBeNull()

    vi.useRealTimers()
  })
})
