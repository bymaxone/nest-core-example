/**
 * @fileoverview Clickable glass card linking to one of the five feature pages.
 *
 * @layer components/overview
 */

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import {
  CardDescription,
  CardHeader,
  CardTitle,
  CARD_TITLE_CONTENT_CLASS,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuickLinkCardProps {
  /** Target route. */
  href: string
  /** Card title. */
  title: string
  /** One-line description of what the page demonstrates. */
  description: string
  /** Lucide icon shown next to the title. */
  icon: LucideIcon
  /** Extra classes, used by the grid to control how the card sizes. */
  className?: string
}

/**
 * Glass surface, entirely clickable, linking to a feature page.
 *
 * This is an interactive panel, not a `Card`: per the design system it matches
 * the card surface but carries no accent hairline, because a grid of quick
 * links would otherwise render a grid of hairlines. The glass tokens and the
 * 24px radius are the interactive-panel recipe from `docs/DESIGN_SYSTEM.md`
 * §6.2. The Errors View's trigger tiles share those same tokens but keep a
 * tighter radius, being a much smaller tile.
 *
 * @param href - Target route.
 * @param title - Card title.
 * @param description - One-line description.
 * @param icon - Lucide icon component.
 * @param className - Extra classes controlling how the card sizes.
 */
export function QuickLinkCard({
  href,
  title,
  description,
  icon: Icon,
  className,
}: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'border-(--glass-border) bg-(--glass-card-bg) hover:bg-(--glass-bg-hover) block rounded-[24px] border text-card-foreground backdrop-blur-lg transition-transform hover:scale-[1.01]',
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
          <CardTitle className={`text-base ${CARD_TITLE_CONTENT_CLASS}`}>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Link>
  )
}
