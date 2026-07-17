/**
 * Component tests for `QuickLinksGrid`.
 *
 * Layer: component.
 * Goal: verify the "Explore" heading renders and one card renders per link.
 * Mocks: none. Pure presentational rendering.
 *
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Activity, HeartPulse } from 'lucide-react'

import { QuickLinksGrid, type QuickLink } from './quick-links-grid'

const LINKS: readonly QuickLink[] = [
  { href: '/latency', title: 'Latency', description: 'Fire delayed requests.', icon: Activity },
  { href: '/health', title: 'Health', description: 'Flip readiness live.', icon: HeartPulse },
]

describe('QuickLinksGrid', () => {
  /**
   * Heading and one card per link.
   *
   * The "Explore" heading renders once, and every link renders its own
   * card with its title and href.
   */
  it('renders the heading and one card per link', () => {
    render(<QuickLinksGrid links={LINKS} />)

    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getByText('Latency')).toBeInTheDocument()
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })
})
