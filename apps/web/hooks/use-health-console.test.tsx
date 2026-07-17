/**
 * Unit tests for the `useHealthConsole` hook.
 *
 * Layer: hook.
 * Goal: verify the derived liveness/readiness statuses, the per-indicator
 *   flaky/hang status extraction, the loading flag before the first fetch,
 *   and that `refreshReadiness` invalidates the shared readiness query key.
 * Mocks: `lib/health-api#getLiveness`, `lib/health-api#getReadiness`.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { HEALTH_READY_QUERY_KEY, useHealthConsole } from './use-health-console'
import { getLiveness, getReadiness } from '@/lib/health-api'

vi.mock('@/lib/health-api', () => ({ getLiveness: vi.fn(), getReadiness: vi.fn() }))

/** Wraps the hook in a fresh QueryClientProvider per test. */
function renderConsole() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  const rendered = renderHook(() => useHealthConsole(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
  return { ...rendered, invalidateSpy }
}

describe('useHealthConsole', () => {
  /**
   * Loading state.
   *
   * Before either query resolves, `loading` is true and both statuses are
   * undefined.
   */
  it('reports loading and undefined statuses before the first fetch resolves', () => {
    vi.mocked(getLiveness).mockReturnValue(new Promise(() => {}))
    vi.mocked(getReadiness).mockReturnValue(new Promise(() => {}))

    const { result } = renderConsole()

    expect(result.current.loading).toBe(true)
    expect(result.current.liveStatus).toBeUndefined()
    expect(result.current.readyStatus).toBeUndefined()
  })

  /**
   * Derived statuses and per-indicator extraction.
   *
   * Once both queries resolve, `liveStatus`/`readyStatus` reflect the
   * responses, and `flakyStatus`/`hangStatus` are pulled from the matching
   * named check.
   */
  it('derives statuses and per-indicator flaky/hang state from the responses', async () => {
    vi.mocked(getLiveness).mockResolvedValue({ ok: true, data: { status: 'ok', checks: [] } })
    vi.mocked(getReadiness).mockResolvedValue({
      ok: true,
      data: {
        status: 'error',
        checks: [
          { name: 'event-loop', status: 'up' },
          { name: 'flaky', status: 'down' },
          { name: 'hanging', status: 'up' },
        ],
      },
    })

    const { result } = renderConsole()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.liveStatus).toBe('ok')
    expect(result.current.readyStatus).toBe('error')
    expect(result.current.flakyStatus).toBe('down')
    expect(result.current.hangStatus).toBe('up')
    expect(result.current.checks).toHaveLength(3)
  })

  /**
   * Refresh action.
   *
   * `refreshReadiness` invalidates exactly the shared readiness query key,
   * the same key the toggles use to make their effect visible immediately.
   */
  it('invalidates the shared readiness query key on refreshReadiness', () => {
    vi.mocked(getLiveness).mockReturnValue(new Promise(() => {}))
    vi.mocked(getReadiness).mockReturnValue(new Promise(() => {}))

    const { result, invalidateSpy } = renderConsole()
    result.current.refreshReadiness()

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: HEALTH_READY_QUERY_KEY })
  })
})
