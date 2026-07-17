/**
 * Component tests for `QuickLinkCard`.
 *
 * Layer: component.
 * Goal: verify the title, description, and link target render correctly.
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
})
