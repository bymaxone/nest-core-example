/**
 * Component tests for `PoisonToggle`.
 *
 * Layer: component.
 * Goal: verify the poison-then-verify flow toasts success when the
 *   follow-up request survives, and toasts an error both when arming the
 *   poison fails and when the follow-up unexpectedly fails.
 * Mocks: `lib/timing-api#poisonTimingSink`, `lib/latency-api#fireDelay`,
 *   `sonner#toast`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { PoisonToggle } from './poison-toggle'
import { fireDelay } from '@/lib/latency-api'
import { poisonTimingSink } from '@/lib/timing-api'

vi.mock('@/lib/latency-api', () => ({ fireDelay: vi.fn() }))
vi.mock('@/lib/timing-api', () => ({ poisonTimingSink: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

/** Renders the component inside a fresh QueryClientProvider per test. */
function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <PoisonToggle />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('PoisonToggle', () => {
  /**
   * Poison succeeds, follow-up succeeds.
   *
   * The core proof this component exists for: a poisoned sink must never
   * prevent the next request from resolving successfully.
   */
  it('toasts success when the sink is poisoned and the follow-up request still succeeds', async () => {
    // Arrange
    vi.mocked(poisonTimingSink).mockResolvedValue({ ok: true, data: { armed: true } })
    vi.mocked(fireDelay).mockResolvedValue({
      ok: true,
      data: { requestedMs: 0, elapsedMs: 1, poisoned: false },
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Poison the sink, then verify' }))

    // Assert
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Sink poisoned, but the next request still returned 1ms elapsed.',
      ),
    )
    expect(fireDelay).toHaveBeenCalledWith(0, false)
  })

  /**
   * Arming the poison itself fails.
   *
   * When `POST /timing/poison` fails, the follow-up request is never
   * attempted, and an error toast reports the arm failure.
   */
  it('toasts an error and skips the follow-up when arming the poison fails', async () => {
    // Arrange
    vi.mocked(poisonTimingSink).mockResolvedValue({
      ok: false,
      kind: 'transport',
      message: 'Failed to fetch',
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Poison the sink, then verify' }))

    // Assert
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to arm the sink poison.'))
    expect(fireDelay).not.toHaveBeenCalled()
  })

  /**
   * Poison succeeds, follow-up unexpectedly fails.
   *
   * Even though this should never happen (the library guarantees the sink
   * never breaks a request), the toggle must still report it as an error
   * rather than silently claiming success.
   */
  it('toasts an error when the follow-up request unexpectedly fails', async () => {
    // Arrange
    vi.mocked(poisonTimingSink).mockResolvedValue({ ok: true, data: { armed: true } })
    vi.mocked(fireDelay).mockResolvedValue({
      ok: false,
      kind: 'transport',
      message: 'Failed to fetch',
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Poison the sink, then verify' }))

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('The follow-up request unexpectedly failed.'),
    )
  })

  /**
   * Pending label.
   *
   * While the poison-then-verify mutation is in flight, the button label
   * switches to "Poisoning…" and is disabled.
   */
  it('shows the pending label and disables the button while poisoning', async () => {
    // Arrange
    let resolvePoison: (() => void) | undefined
    vi.mocked(poisonTimingSink).mockReturnValue(
      new Promise((resolve) => {
        resolvePoison = () => resolve({ ok: true, data: { armed: true } })
      }),
    )
    vi.mocked(fireDelay).mockResolvedValue({
      ok: true,
      data: { requestedMs: 0, elapsedMs: 1, poisoned: false },
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Poison the sink, then verify' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Poisoning…' })).toBeDisabled()

    // Cleanup: resolve so the test does not leave a dangling act() warning.
    resolvePoison?.()
  })
})
