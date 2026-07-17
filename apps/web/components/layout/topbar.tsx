/**
 * @fileoverview Fixed top bar for the dashboard.
 *
 * Visual style mirrors the shared Bymax example-app design system:
 *   - Dark glass: rgba(10,10,10,0.85) + backdrop-blur-md
 *   - 1px border-bottom: rgba(255,255,255,0.07)
 *   - Brand icon + gradient wordmark (left, always visible)
 *   - Hamburger (mobile) + API-origin chip (right)
 *
 * Height: 64px. Stacked above the sidebar on all screen sizes.
 *
 * @layer components/layout
 */

'use client'

import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { env } from '@/lib/env'

/** Hostname portion of the configured API origin, shown as a topbar chip. */
const API_HOST = new URL(env.NEXT_PUBLIC_API_URL).host

interface TopbarProps {
  /** Called when the hamburger button is pressed to toggle the sidebar. */
  onMenuOpen: () => void
}

/**
 * Fixed top bar — brand identity (left) + API-origin chip (right).
 *
 * @param onMenuOpen - Handler invoked by the mobile hamburger button.
 */
export function Topbar({ onMenuOpen }: TopbarProps) {
  return (
    <header className="z-200 fixed left-0 right-0 top-0 flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.07)] bg-[rgba(10,10,10,0.85)] px-4 backdrop-blur-md lg:px-6">
      {/* Left: brand */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(255,98,36,0.4)] bg-[rgba(255,98,36,0.15)]"
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#ff6224"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <span className="bg-linear-to-r select-none from-[#ff6224] to-amber-200 bg-clip-text font-mono text-sm font-bold leading-tight text-transparent">
          nest-core-example
        </span>
      </div>

      {/* Right: hamburger (mobile) + API origin chip */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          className="flex lg:hidden"
          onClick={onMenuOpen}
        >
          <Menu className="h-4 w-4 text-[rgba(255,255,255,0.7)]" />
        </Button>

        <span className="border-(--glass-border) bg-(--glass-bg) hidden items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] text-[rgba(255,255,255,0.6)] lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
          api: {API_HOST}
        </span>
      </div>
    </header>
  )
}
