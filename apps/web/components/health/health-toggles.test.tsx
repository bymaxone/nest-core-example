/**
 * Component tests for `HealthToggles`.
 *
 * Layer: component.
 * Goal: verify both toggle cards render with their titles, and that the
 *   hanging card's derived active value correctly maps its up/down status
 *   to the arm/disarm option.
 * Mocks: `lib/health-api#toggleFlaky`, `lib/health-api#toggleHang` (never
 *   invoked directly here; only referenced through the rendered card).
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { HealthToggles } from './health-toggles'
import { toggleFlaky, toggleHang } from '@/lib/health-api'

vi.mock('@/lib/health-api', () => ({ toggleFlaky: vi.fn(), toggleHang: vi.fn() }))

/** Renders the component inside a fresh QueryClientProvider per test. */
function renderToggles(props: Partial<Parameters<typeof HealthToggles>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HealthToggles
        flakyStatus={props.flakyStatus}
        hangStatus={props.hangStatus}
        onToggled={props.onToggled ?? vi.fn()}
      />
    </QueryClientProvider>,
  )
}

describe('HealthToggles', () => {
  /**
   * Both cards render.
   *
   * The flaky and hanging cards both render with their titles and options.
   */
  it('renders both toggle cards with their titles', () => {
    renderToggles()

    expect(screen.getByText('Flaky indicator')).toBeInTheDocument()
    expect(screen.getByText('Hanging indicator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Arm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disarm' })).toBeInTheDocument()
  })

  /**
   * Hanging status maps down -> Arm active.
   *
   * When the hanging indicator's status is `down` (armed and timing out),
   * the "Arm" option renders as the active one.
   */
  it('renders Arm as active when hangStatus is down', () => {
    renderToggles({ hangStatus: 'down' })

    expect(screen.getByRole('button', { name: 'Arm' }).className).toContain('bg-linear-to-r')
  })

  /**
   * Hanging status maps up -> Disarm active.
   *
   * When the hanging indicator's status is `up`, "Disarm" renders as the
   * active option instead.
   */
  it('renders Disarm as active when hangStatus is up', () => {
    renderToggles({ hangStatus: 'up' })

    expect(screen.getByRole('button', { name: 'Disarm' }).className).toContain('bg-linear-to-r')
  })

  /**
   * Flaky toggle wiring.
   *
   * Clicking "Down" on the flaky card calls `toggleFlaky('down')`: the
   * card's `onToggle` prop is wired to the flaky-specific API function.
   */
  it('wires the flaky card onToggle to toggleFlaky', async () => {
    // Arrange
    vi.mocked(toggleFlaky).mockResolvedValue({ ok: true, data: { name: 'flaky', state: 'down' } })
    renderToggles({ flakyStatus: 'up' })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Down' }))

    // Assert
    await vi.waitFor(() => expect(toggleFlaky).toHaveBeenCalledWith('down'))
  })

  /**
   * Hanging toggle wiring.
   *
   * Clicking "Arm" on the hanging card calls `toggleHang(true)`: the
   * card's `onToggle` prop converts the string option to a boolean.
   */
  it('wires the hanging card onToggle to toggleHang', async () => {
    // Arrange
    vi.mocked(toggleHang).mockResolvedValue({ ok: true, data: { name: 'hanging', state: true } })
    renderToggles({ hangStatus: 'up' })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Arm' }))

    // Assert
    await vi.waitFor(() => expect(toggleHang).toHaveBeenCalledWith(true))
  })
})
