/**
 * @fileoverview Dashboard layout: the client provider boundary and the app shell.
 *
 * The query client, the topbar, the sidebar and the ambient glow all live here
 * rather than in the root layout. That keeps the public landing page at `/`
 * full-bleed and fully server-rendered: it never enters the `'use client'`
 * boundary, so the query client ships only to the dashboard, which is the only
 * part of the app that reads from the API.
 *
 * @layer layouts
 */

import { AppShell } from '@/components/layout/app-shell'

import Providers from '../providers'

interface DashboardLayoutProps {
  /** Dashboard page content rendered in the main column. */
  children: React.ReactNode
}

/**
 * Wrap every dashboard route in the client providers and the shared app shell.
 *
 * @param children - Dashboard page content.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  )
}
