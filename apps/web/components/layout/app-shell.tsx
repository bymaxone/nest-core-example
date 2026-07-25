/**
 * @fileoverview App shell: the ambient glow backdrop plus the client component
 * that owns sidebar toggle state.
 *
 * Wraps `Topbar` + `Sidebar` + `main` content in a responsive flex layout.
 * Extracted from `app/layout.tsx` so the root layout stays a server
 * component while the sidebar open/close state (React `useState`) lives here.
 *
 * @layer layouts
 */

'use client'

import { useState, type ReactNode } from 'react'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

interface AppShellProps {
  /** Page content rendered in the main column. */
  children: ReactNode
}

/**
 * The three decorative glow layers that sit behind the whole dashboard.
 *
 * They are what makes the cards' `backdrop-blur` visible: a blur filter over a
 * flat near-black page samples a uniform color and renders identically to no
 * blur at all. These wide, heavily blurred color fields give the glass surfaces
 * something to pick up, so the effect reads as depth rather than as a tint.
 * Purely presentational and never interactive.
 */
function AmbientGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-glow-float absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#ff6224] opacity-15 blur-[120px]" />
      <div className="animate-glow-drift absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-[#60a5fa] opacity-10 blur-[100px]" />
      <div className="animate-glow-float absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#f97316] opacity-[0.05] blur-[80px]" />
    </div>
  )
}

/**
 * Client shell for the dashboard: manages sidebar visibility state.
 *
 * @param children - Page content.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <AmbientGlow />

      <Topbar onMenuOpen={() => setSidebarOpen(true)} />

      {/* Page body: below the fixed topbar */}
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onNavClick={() => setSidebarOpen(false)} />

        {/* Mobile sidebar backdrop. A real button rather than a click-handled
            div, so the open drawer can also be dismissed from the keyboard. */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="z-90 fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </>
  )
}
