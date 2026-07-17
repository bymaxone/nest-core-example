/**
 * Component tests for `DelayControl`.
 *
 * Layer: component.
 * Goal: verify the slider updates the displayed value, firing calls the
 *   delay endpoint with the current value, and both the success and
 *   transport-failure toast paths are exercised.
 * Mocks: `lib/latency-api#fireDelay`, `sonner#toast`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { DelayControl } from './delay-control'
import { fireDelay } from '@/lib/latency-api'

vi.mock('@/lib/latency-api', () => ({ fireDelay: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

/** Renders the component inside a fresh QueryClientProvider per test. */
function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <DelayControl />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('DelayControl', () => {
  /**
   * Slider updates the displayed value.
   *
   * Moving the range input must immediately update the mono value label.
   */
  it('updates the displayed delay when the slider moves', () => {
    renderWithQueryClient()

    fireEvent.change(screen.getByLabelText('Delay'), { target: { value: '1200' } })

    expect(screen.getByText('1200 ms')).toBeInTheDocument()
  })

  /**
   * Successful fire.
   *
   * Clicking "Fire request" calls `fireDelay` with the current slider value
   * and shows a success toast with the elapsed time.
   */
  it('fires the current delay and toasts success on a successful response', async () => {
    // Arrange
    vi.mocked(fireDelay).mockResolvedValue({
      ok: true,
      data: { requestedMs: 500, elapsedMs: 502, poisoned: false },
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Fire request' }))

    // Assert
    await waitFor(() => expect(fireDelay).toHaveBeenCalledWith(500))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Fired 500ms, elapsed 502ms'))
  })

  /**
   * Transport failure.
   *
   * A transport-kind failure shows an error toast with the failure message
   * instead of a success toast.
   */
  it('toasts an error when the request fails at the transport level', async () => {
    // Arrange
    vi.mocked(fireDelay).mockResolvedValue({
      ok: false,
      kind: 'transport',
      message: 'Failed to fetch',
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Fire request' }))

    // Assert
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to fetch'))
  })

  /**
   * Envelope-kind result.
   *
   * `/latency` never validates its input away (values are clamped, not
   * rejected), but the result type still allows an `envelope` failure; the
   * handler must silently no-op rather than throw when that branch occurs.
   */
  it('does not toast when the result is an envelope failure', async () => {
    // Arrange
    vi.mocked(fireDelay).mockResolvedValue({
      ok: false,
      kind: 'envelope',
      error: {
        statusCode: 400,
        code: 'BYMAX_BAD_REQUEST',
        message: 'unexpected',
        timestamp: 't',
        path: '/latency',
      },
    })
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Fire request' }))
    await waitFor(() => expect(fireDelay).toHaveBeenCalled())

    // Assert
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  /**
   * Pending label.
   *
   * While the mutation is in flight, the button label switches to
   * "Firing…" and is disabled, preventing a duplicate fire.
   */
  it('shows the pending label and disables the button while firing', async () => {
    // Arrange
    let resolveFire: (() => void) | undefined
    vi.mocked(fireDelay).mockReturnValue(
      new Promise((resolve) => {
        resolveFire = () =>
          resolve({ ok: true, data: { requestedMs: 500, elapsedMs: 500, poisoned: false } })
      }),
    )
    renderWithQueryClient()

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Fire request' }))

    // Assert
    expect(await screen.findByRole('button', { name: 'Firing…' })).toBeDisabled()

    // Cleanup: resolve so the test does not leave a dangling act() warning.
    resolveFire?.()
  })
})
