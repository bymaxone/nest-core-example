/**
 * Component tests for `FireTraffic`.
 *
 * Layer: component.
 * Goal: verify a click fires the documented burst size of catalog requests
 *   concurrently, toasts the success count, and calls back so the parent
 *   can refetch the scrape; and that the pending label shows while in flight.
 * Mocks: `lib/catalog-api#listOffsetProducts`, `sonner#toast`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { FireTraffic } from './fire-traffic'
import { listOffsetProducts } from '@/lib/catalog-api'

vi.mock('@/lib/catalog-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/catalog-api')>()
  return { ...actual, listOffsetProducts: vi.fn() }
})
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

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
})
