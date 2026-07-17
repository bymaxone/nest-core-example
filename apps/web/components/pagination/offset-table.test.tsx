/**
 * Component tests for `OffsetTable`.
 *
 * Layer: component.
 * Goal: verify the table renders the fetched page and its raw meta, the
 *   prev/next controls clamp against page 1 and the last page, and the
 *   limit control resets to page 1 when changed.
 * Mocks: `lib/catalog-api#listOffsetProducts`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { OffsetTable } from './offset-table'
import { listOffsetProducts } from '@/lib/catalog-api'

vi.mock('@/lib/catalog-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog-api')>()
  return { ...actual, listOffsetProducts: vi.fn() }
})

/** Renders the component inside a fresh QueryClientProvider per test. */
function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <OffsetTable />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('OffsetTable', () => {
  /**
   * Initial page render.
   *
   * On mount, page 1 with the default limit (10) is requested and the
   * returned items and raw meta both render.
   */
  it('requests page 1 on mount and renders the items and raw meta', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: 'p-000001',
            name: 'Kestrel Backpack',
            category: 'electronics',
            priceCents: 2660,
            createdAt: 't',
          },
        ],
        meta: { page: 1, limit: 10, totalItems: 240, totalPages: 24 },
      },
    })
    renderWithQueryClient()

    // Assert
    await waitFor(() => expect(listOffsetProducts).toHaveBeenCalledWith(1, 10))
    expect(await screen.findByText('Kestrel Backpack')).toBeInTheDocument()
    expect(screen.getByText('$26.60')).toBeInTheDocument()
    expect(screen.getByText(/"totalItems": 240/)).toBeInTheDocument()
  })

  /**
   * Prev button clamped at page 1.
   *
   * The Prev button is disabled on the first page, so the page number can
   * never go below 1.
   */
  it('disables Prev on the first page', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: { items: [], meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } },
    })
    renderWithQueryClient()

    // Assert
    expect(await screen.findByRole('button', { name: 'Prev' })).toBeDisabled()
  })

  /**
   * Next button clamped at the last page.
   *
   * Once `meta.totalPages` is reached, Next disables so the page number
   * can never exceed the catalog's real page count.
   */
  it('disables Next once the last page is reached', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: { items: [], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
    })
    renderWithQueryClient()

    // Assert: wait for the meta-derived page indicator before checking the
    // button, since it starts enabled until the query resolves.
    await screen.findByText('Page 1 / 1')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  /**
   * Next advances the page.
   *
   * Clicking Next on a non-last page re-requests with the incremented page.
   */
  it('requests the next page when Next is clicked', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: { items: [], meta: { page: 1, limit: 10, totalItems: 50, totalPages: 5 } },
    })
    renderWithQueryClient()
    await screen.findByText(/"totalItems": 50/)

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Assert
    await waitFor(() => expect(listOffsetProducts).toHaveBeenCalledWith(2, 10))
  })

  /**
   * Prev retreats the page.
   *
   * From page 2, clicking Prev re-requests page 1, and the clamp never lets
   * it go below page 1.
   */
  it('requests the previous page when Prev is clicked from page 2', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: { items: [], meta: { page: 2, limit: 10, totalItems: 50, totalPages: 5 } },
    })
    renderWithQueryClient()
    await screen.findByText(/"totalItems": 50/)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(listOffsetProducts).toHaveBeenCalledWith(2, 10))

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Prev' }))

    // Assert
    await waitFor(() => expect(listOffsetProducts).toHaveBeenCalledWith(1, 10))
  })

  /**
   * Limit change resets to page 1.
   *
   * Changing the limit while on a later page must re-fetch page 1, never a
   * stale page number for the new page size.
   */
  it('resets to page 1 when the limit changes', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: { items: [], meta: { page: 1, limit: 10, totalItems: 50, totalPages: 5 } },
    })
    renderWithQueryClient()
    await screen.findByText(/"totalItems": 50/)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(listOffsetProducts).toHaveBeenCalledWith(2, 10))

    // Act: open the limit select and choose 20.
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: '20' }))

    // Assert
    await waitFor(() => expect(listOffsetProducts).toHaveBeenCalledWith(1, 20))
  })

  /**
   * Empty page.
   *
   * A page with no items (out-of-range page) shows the empty-state row
   * rather than a blank table body.
   */
  it('renders an empty-state row when the page has no items', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: { items: [], meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } },
    })
    renderWithQueryClient()

    // Assert
    expect(await screen.findByText('No products on this page.')).toBeInTheDocument()
  })
})
