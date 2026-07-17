/**
 * Component tests for `CursorTrail`.
 *
 * Layer: component.
 * Goal: verify the empty state, one chip per cursor with its walk-order
 *   index, and the copy-to-clipboard action.
 * Mocks: `navigator.clipboard.writeText`, `sonner#toast`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { toast } from 'sonner'

import { CursorTrail } from './cursor-trail'

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('CursorTrail', () => {
  /**
   * Empty state.
   *
   * Before any page has been walked, a plain placeholder renders instead of
   * an empty chip row.
   */
  it('renders a placeholder when no cursors have been walked', () => {
    render(<CursorTrail cursors={[]} />)
    expect(screen.getByText('No cursors walked yet.')).toBeInTheDocument()
  })

  /**
   * One chip per cursor, in walk order.
   *
   * Each cursor renders its own chip labeled with its 1-based walk index.
   */
  it('renders one labeled chip per cursor', () => {
    render(<CursorTrail cursors={['cursor-a', 'cursor-b']} />)

    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('cursor-a')).toBeInTheDocument()
    expect(screen.getByText('cursor-b')).toBeInTheDocument()
  })

  /**
   * Copy action.
   *
   * Clicking a chip copies that exact cursor to the clipboard and confirms
   * it with a success toast.
   */
  it('copies the clicked cursor to the clipboard and toasts a confirmation', async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<CursorTrail cursors={['cursor-a', 'cursor-b']} />)

    // Act
    fireEvent.click(screen.getByText('cursor-b'))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('cursor-b'))

    // Assert
    expect(toast.success).toHaveBeenCalledWith('Cursor copied')
  })
})
