/**
 * Component tests for `QuickLinkCard`.
 *
 * Layer: component.
 * Goal: verify the title, description, and link target render correctly, and
 *   that the panel carries no accent hairline, since a grid of quick links
 *   would otherwise render a grid of them.
 * Mocks: none. Pure presentational rendering (Next.js `Link` renders a plain
 *   `<a>` under jsdom without a router mock).
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Activity } from 'lucide-react'

import { QuickLinkCard } from './quick-link-card'

describe('QuickLinkCard', () => {
  /**
   * Base rendering.
   *
   * Title and description render as passed, and the anchor points at the
   * given href.
   */
  it('renders the title, description, and link href', () => {
    render(
      <QuickLinkCard
        href="/latency"
        title="Latency"
        description="Fire delayed requests."
        icon={Activity}
      />,
    )

    expect(screen.getByText('Latency')).toBeInTheDocument()
    expect(screen.getByText('Fire delayed requests.')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/latency')
  })

  /**
   * Interactive panels carry no accent hairline.
   *
   * The design system reserves the hairline for `Card`: a quick-link grid
   * rendering one per tile is noise. The hairline is a 1px-high span, so its
   * absence is asserted structurally rather than by matching a class string.
   */
  it('renders no accent hairline', () => {
    const { container } = render(
      <QuickLinkCard
        href="/latency"
        title="Latency"
        description="Fire delayed requests."
        icon={Activity}
      />,
    )

    expect(container.querySelector('.h-px')).toBeNull()
  })
})
