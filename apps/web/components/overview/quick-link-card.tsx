/**
 * @fileoverview Clickable glass card linking to one of the five feature pages.
 *
 * @layer components/overview
 */

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface QuickLinkCardProps {
  /** Target route. */
  href: string
  /** Card title. */
  title: string
  /** One-line description of what the page demonstrates. */
  description: string
  /** Lucide icon shown next to the title. */
  icon: LucideIcon
}

/**
 * Glass card, entirely clickable, linking to a feature page.
 *
 * @param href - Target route.
 * @param title - Card title.
 * @param description - One-line description.
 * @param icon - Lucide icon component.
 */
export function QuickLinkCard({ href, title, description, icon: Icon }: QuickLinkCardProps) {
  return (
    <Link href={href} className="block transition-transform hover:scale-[1.01]">
      <Card>
        <CardHeader accent>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
