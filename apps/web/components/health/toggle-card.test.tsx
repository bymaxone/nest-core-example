/**
 * Component tests for `ToggleCard`.
 *
 * Layer: component.
 * Goal: verify the active option is highlighted, clicking a non-active
 *   option fires the toggle and, on success, toasts and notifies the
 *   parent; a transport failure toasts an error without notifying the
 *   parent.
 * Mocks: `sonner#toast`.
 *
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ToggleCard } from './toggle-card'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
] as const

/** Renders the component inside a fresh QueryClientProvider per test. */
function renderCard(props: Partial<Parameters<typeof ToggleCard<'up' | 'down'>>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onToggle = props.onToggle ?? vi.fn().mockResolvedValue({ ok: true, data: {} })
  const onToggled = props.onToggled ?? vi.fn()
  return {
    onToggle,
    onToggled,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ToggleCard
          title="Flaky indicator"
          options={OPTIONS}
          activeValue={props.activeValue}
          onToggle={onToggle}
          onToggled={onToggled}
        />
      </QueryClientProvider>,
    ),
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('ToggleCard', () => {
  /**
   * Active option highlighted.
   *
   * The currently active value renders with the `default` (filled) button
   * variant; the other renders as `outline`.
   */
  it('renders the active option with the default variant', () => {
    renderCard({ activeValue: 'up' })

    const upButton = screen.getByRole('button', { name: 'Up' })
    const downButton = screen.getByRole('button', { name: 'Down' })
    expect(upButton.className).toContain('bg-gradient-to-r')
    expect(downButton.className).not.toContain('bg-gradient-to-r')
  })

  /**
   * Successful toggle.
   *
   * Clicking a non-active option calls `onToggle` with its value and, on
   * success, toasts and calls `onToggled`.
   */
  it('toggles, toasts success, and notifies the parent on a successful request', async () => {
    // Arrange
    const { onToggle, onToggled } = renderCard({ activeValue: 'up' })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Down' }))

    // Assert: the toast message (asserted below) already pins that 'down'
    // is the value the component passed through to onToggle.
    await vi.waitFor(() => expect(onToggle).toHaveBeenCalled())
    await vi.waitFor(() => expect(onToggled).toHaveBeenCalled())
    expect(toast.success).toHaveBeenCalledWith('Flaky indicator: set to down')
  })

  /**
   * Transport failure.
   *
   * A transport-kind failure toasts an error and never calls `onToggled`.
   */
  it('toasts an error and does not notify the parent on a transport failure', async () => {
    // Arrange
    const onToggle = vi
      .fn()
      .mockResolvedValue({ ok: false, kind: 'transport', message: 'Failed to fetch' })
    const { onToggled } = renderCard({ activeValue: 'up', onToggle })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Down' }))

    // Assert
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to fetch'))
    expect(onToggled).not.toHaveBeenCalled()
  })

  /**
   * Envelope failure.
   *
   * The toggle endpoints are not expected to return a documented error
   * envelope in practice, but the branch must still no-op silently rather
   * than throwing or toasting a malformed message.
   */
  it('does not toast or notify the parent on an envelope failure', async () => {
    // Arrange
    const onToggle = vi.fn().mockResolvedValue({
      ok: false,
      kind: 'envelope',
      error: {
        statusCode: 400,
        code: 'BYMAX_VALIDATION_FAILED',
        message: 'unexpected',
        timestamp: 't',
        path: '/health-demo/flaky',
      },
    })
    const { onToggled } = renderCard({ activeValue: 'up', onToggle })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Down' }))

    // Assert
    await vi.waitFor(() => expect(onToggle).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
    expect(onToggled).not.toHaveBeenCalled()
  })
})
