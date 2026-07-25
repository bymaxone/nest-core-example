/**
 * @fileoverview The Overview page's "Explore" section: a heading plus the
 * grid of quick-link cards to the five feature pages.
 *
 * @layer components/overview
 */

import type { LucideIcon } from 'lucide-react'

import { QuickLinkCard } from './quick-link-card'

/** One entry in the quick-link grid. */
export interface QuickLink {
  readonly href: string
  readonly title: string
  readonly description: string
  readonly icon: LucideIcon
}

interface QuickLinksGridProps {
  /** Every feature page to link to. */
  links: readonly QuickLink[]
}

/**
 * "Explore" heading plus a responsive grid of quick-link cards.
 *
 * @param links - Every feature page to link to.
 */
export function QuickLinksGrid({ links }: QuickLinksGridProps) {
  return (
    <div>
      <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Explore
      </h2>
      {/*
        Flex rather than a fixed-column grid: five cards in a three-column grid
        leave a hole in the second row. Here each card asks for a minimum width
        and then grows to absorb the leftover space, so a row always fills
        edge to edge whatever the card count is. The basis alone drives how
        many fit per row, so no breakpoints are needed.
      */}
      <div className="flex flex-wrap gap-4">
        {links.map((link) => (
          <QuickLinkCard key={link.href} {...link} className="grow basis-[220px]" />
        ))}
      </div>
    </div>
  )
}
