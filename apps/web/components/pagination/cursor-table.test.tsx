/**
 * Component tests for `CursorTable`.
 *
 * Layer: component.
 * Goal: verify the load-more accumulation flow (first page with no cursor,
 *   subsequent pages recording each cursor walked), the end-of-catalog
 *   state when `nextCursor` is null, and the corrupt-cursor flow rendering
 *   the resulting envelope inline.
 * Mocks: `lib/catalog-api#listCursorProducts`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { CursorTable } from './cursor-table'
import { listCursorProducts } from '@/lib/catalog-api'

vi.mock('@/lib/catalog-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog-api')>()
  return { ...actual, listCursorProducts: vi.fn() }
})
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

/** Renders the component inside a fresh QueryClientProvider per test. */
function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <CursorTable />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('CursorTable', () => {
  /**
   * First page, no cursor.
   *
   * The first "Load more" click must call with `cursor: undefined` and not
   * record a cursor chip (there is nothing to walk back to yet).
   */
  it('loads the first page without a cursor and renders its items', async () => {
    // Arrange
    vi.mocked(listCursorProducts).mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: 'p-000001',
            name: 'Kestrel Backpack',
            category: 'electronics',
            priceCents: 1000,
            createdAt: 't',
          },
        ],
        nextCursor: 'cursor-1',
      },
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))

    // Assert
    await screen.findByText('Kestrel Backpack')
    expect(listCursorProducts).toHaveBeenCalledWith(undefined, 10)
    expect(screen.getByText('No cursors walked yet.')).toBeInTheDocument()
  })

  /**
   * Second page, cursor recorded.
   *
   * Loading a second page passes the previous `nextCursor` and records it
   * in the trail, and accumulates items rather than replacing them.
   */
  it('accumulates items and records the cursor on a second load', async () => {
    // Arrange
    vi.mocked(listCursorProducts)
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [
            {
              id: 'p-000001',
              name: 'First',
              category: 'electronics',
              priceCents: 1000,
              createdAt: 't',
            },
          ],
          nextCursor: 'cursor-1',
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          items: [
            { id: 'p-000002', name: 'Second', category: 'home', priceCents: 2000, createdAt: 't' },
          ],
          nextCursor: null,
        },
      })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    await screen.findByText('First')
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    await screen.findByText('Second')

    // Assert
    expect(listCursorProducts).toHaveBeenNthCalledWith(2, 'cursor-1', 10)
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('End of catalog: nextCursor is null.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled()
  })

  /**
   * Corrupt-cursor flow.
   *
   * Clicking "Corrupt the cursor" fires a tampered cursor and, on the
   * envelope-kind failure the server returns, renders it inline via
   * `EnvelopeViewer`.
   */
  it('renders the envelope inline after corrupting the cursor', async () => {
    // Arrange
    vi.mocked(listCursorProducts).mockResolvedValue({
      ok: false,
      kind: 'envelope',
      error: {
        statusCode: 400,
        code: 'BYMAX_VALIDATION_FAILED',
        message: 'Malformed pagination cursor.',
        timestamp: 't',
        path: '/catalog/products/cursor',
      },
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Corrupt the cursor' }))

    // Assert
    await waitFor(() => expect(screen.getByText(/"BYMAX_VALIDATION_FAILED"/)).toBeInTheDocument())
    expect(screen.getByText('Corrupt-cursor response')).toBeInTheDocument()
  })

  /**
   * Corrupt-cursor flow, no prior page loaded.
   *
   * Corrupting before any real page has loaded must still fire a request
   * (using the fallback seed cursor) instead of throwing.
   */
  it('uses a fallback seed cursor when corrupting before any page has loaded', async () => {
    // Arrange
    vi.mocked(listCursorProducts).mockResolvedValue({
      ok: true,
      data: { items: [], nextCursor: null },
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Corrupt the cursor' }))

    // Assert
    await waitFor(() => expect(listCursorProducts).toHaveBeenCalled())
    const [calledCursor] = vi.mocked(listCursorProducts).mock.calls[0] ?? []
    expect(typeof calledCursor).toBe('string')
    expect(calledCursor).not.toBe('')
  })

  /**
   * Load-more transport failure.
   *
   * A non-ok result (network error) must leave the accumulated items and
   * cursor trail untouched rather than throwing or corrupting state.
   */
  it('leaves items and cursors unchanged when a load-more request fails', async () => {
    // Arrange
    vi.mocked(listCursorProducts).mockResolvedValue({
      ok: false,
      kind: 'transport',
      message: 'Failed to fetch',
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    await waitFor(() => expect(listCursorProducts).toHaveBeenCalled())

    // Assert
    expect(screen.getByText('No cursors walked yet.')).toBeInTheDocument()
    expect(
      screen.getByText('Nothing loaded yet. Click "Load more" to start walking the catalog.'),
    ).toBeInTheDocument()
  })

  /**
   * Load-more pending label.
   *
   * While the load-more mutation is in flight, the button label switches
   * to "Loading..." and is disabled.
   */
  it('shows the pending label on Load more while the request is in flight', async () => {
    // Arrange
    let resolveLoad: (() => void) | undefined
    vi.mocked(listCursorProducts).mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = () => resolve({ ok: true, data: { items: [], nextCursor: null } })
      }),
    )
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Loading...' })).toBeDisabled()

    // Cleanup: resolve so the test does not leave a dangling act() warning.
    resolveLoad?.()
  })

  /**
   * Corrupt pending label.
   *
   * While the corrupt-cursor mutation is in flight, the button label
   * switches to "Corrupting..." and is disabled.
   */
  it('shows the pending label on Corrupt the cursor while the request is in flight', async () => {
    // Arrange
    let resolveCorrupt: (() => void) | undefined
    vi.mocked(listCursorProducts).mockReturnValue(
      new Promise((resolve) => {
        resolveCorrupt = () => resolve({ ok: true, data: { items: [], nextCursor: null } })
      }),
    )
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Corrupt the cursor' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Corrupting...' })).toBeDisabled()

    // Cleanup: resolve so the test does not leave a dangling act() warning.
    resolveCorrupt?.()
  })
})
