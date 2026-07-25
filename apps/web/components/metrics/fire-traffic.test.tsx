/**
 * Component tests for `FireTraffic`.
 *
 * Layer: component.
 * Goal: verify a click fires the documented burst size of catalog requests
 *   concurrently, toasts the success count, and calls back so the parent
 *   can refetch the scrape; that the lookup button increments the custom
 *   counter and reports each documented outcome; and that both buttons show
 *   their pending label while in flight.
 * Mocks: `lib/catalog-api#listOffsetProducts`,
 *   `lib/metrics-api#recordCatalogLookup`, `sonner#toast`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { FireTraffic } from './fire-traffic'
import { listOffsetProducts } from '@/lib/catalog-api'
import { recordCatalogLookup } from '@/lib/metrics-api'

vi.mock('@/lib/catalog-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog-api')>()
  return { ...actual, listOffsetProducts: vi.fn() }
})
vi.mock('@/lib/metrics-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/metrics-api')>()
  return { ...actual, recordCatalogLookup: vi.fn() }
})
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

/** Renders the component inside a fresh QueryClientProvider per test. */
function renderWithQueryClient(onFired = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    onFired,
    ...render(
      <QueryClientProvider client={queryClient}>
        <FireTraffic onFired={onFired} />
      </QueryClientProvider>,
    ),
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FireTraffic', () => {
  /**
   * Successful burst.
   *
   * Clicking fires 10 concurrent catalog requests, toasts the success
   * count, and calls `onFired` so the parent refetches the scrape.
   */
  it('fires 10 requests, toasts the success count, and notifies the parent', async () => {
    // Arrange
    vi.mocked(listOffsetProducts).mockResolvedValue({
      ok: true,
      data: { items: [], meta: { page: 1, limit: 5, totalItems: 240, totalPages: 48 } },
    })
    const { onFired } = renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Fire 10 requests' }))

    // Assert
    await vi.waitFor(() => expect(listOffsetProducts).toHaveBeenCalledTimes(10))
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Fired 10 requests, 10 succeeded'),
    )
    expect(onFired).toHaveBeenCalled()
  })

  /**
   * Partial failure count.
   *
   * The success count reflects only the requests that actually resolved
   * `ok: true`, not the total fired.
   */
  it('counts only the successful requests when some fail', async () => {
    // Arrange
    vi.mocked(listOffsetProducts)
      .mockResolvedValueOnce({ ok: false, kind: 'transport', message: 'Failed to fetch' })
      .mockResolvedValue({
        ok: true,
        data: { items: [], meta: { page: 1, limit: 5, totalItems: 240, totalPages: 48 } },
      })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Fire 10 requests' }))

    // Assert
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Fired 10 requests, 9 succeeded'),
    )
  })

  /**
   * Pending label.
   *
   * While the burst is in flight, the button label switches to "Firing
   * traffic..." and is disabled.
   */
  it('shows the pending label while the burst is in flight', async () => {
    // Arrange: every call returns a promise that never resolves, so the
    // burst stays pending for the duration of this assertion.
    vi.mocked(listOffsetProducts).mockImplementation(() => new Promise(() => {}))
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Fire 10 requests' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Firing traffic...' })).toBeDisabled()
  })

  /**
   * Successful custom-counter lookup.
   *
   * The lookup button is the only control that moves `catalog_lookups_total`,
   * so a success toasts the counter's new total and calls `onFired` to
   * refetch the scrape that proves it grew.
   */
  it('records a lookup, toasts the new total, and notifies the parent', async () => {
    // Arrange
    vi.mocked(recordCatalogLookup).mockResolvedValue({
      ok: true,
      data: { metric: 'catalog_lookups_total', total: 6 },
    })
    const { onFired } = renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Record catalog lookup' }))

    // Assert
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('catalog_lookups_total is now 6'),
    )
    expect(onFired).toHaveBeenCalled()
  })

  /**
   * Lookup transport failure.
   *
   * An unreachable API surfaces its message as an error toast, and the
   * parent is not asked to refetch a scrape that did not change.
   */
  it('toasts an error and does not notify the parent on a transport failure', async () => {
    // Arrange
    vi.mocked(recordCatalogLookup).mockResolvedValue({
      ok: false,
      kind: 'transport',
      message: 'Failed to fetch',
    })
    const { onFired } = renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Record catalog lookup' }))

    // Assert
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to fetch'))
    expect(onFired).not.toHaveBeenCalled()
  })

  /**
   * Lookup envelope failure.
   *
   * A documented error envelope is neither a success nor a transport fault:
   * it is already rendered by the page's envelope viewer, so the button
   * stays silent rather than double-reporting it as a toast.
   */
  it('does not toast or notify the parent on an envelope failure', async () => {
    // Arrange
    vi.mocked(recordCatalogLookup).mockResolvedValue({
      ok: false,
      kind: 'envelope',
      error: {
        statusCode: 503,
        code: 'BYMAX_SERVICE_UNAVAILABLE',
        message: 'Metrics are disabled',
        timestamp: '2026-01-01T00:00:00.000Z',
        path: '/metrics-demo/lookup',
      },
    })
    const { onFired } = renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Record catalog lookup' }))

    // Assert
    await vi.waitFor(() => expect(recordCatalogLookup).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
    expect(onFired).not.toHaveBeenCalled()
  })

  /**
   * Lookup pending label.
   *
   * While the lookup is in flight its own label switches and both buttons
   * disable, so a second click cannot race the first.
   */
  it('shows the pending label and disables both buttons while the lookup is in flight', async () => {
    // Arrange: the lookup never settles, so it stays pending for this assertion.
    vi.mocked(recordCatalogLookup).mockImplementation(() => new Promise(() => {}))
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Record catalog lookup' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Recording lookup...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Fire 10 requests' })).toBeDisabled()
  })
})
