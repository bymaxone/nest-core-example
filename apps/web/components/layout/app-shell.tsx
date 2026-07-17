/**
 * @fileoverview App shell — client component that owns sidebar toggle state.
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
 * Client shell for the dashboard — manages sidebar visibility state.
 *
 * @param children - Page content.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Topbar onMenuOpen={() => setSidebarOpen(true)} />

      {/* Page body — below the fixed topbar */}
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onNavClick={() => setSidebarOpen(false)} />

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            aria-hidden="true"
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
