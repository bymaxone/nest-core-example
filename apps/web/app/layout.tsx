/**
 * @fileoverview Root layout — HTML shell, font loading, and global providers.
 *
 * Uses Geist Sans + Geist Mono from the `geist` package. The font CSS
 * variables are injected into `<html>` and consumed by globals.css. Forced
 * dark: no theme toggle, no `next-themes`.
 *
 * The client provider boundary (`<Providers>`) lives in `app/providers.tsx`
 * so this server component stays free of `'use client'`.
 *
 * @layer layouts
 */

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import { AppShell } from '@/components/layout/app-shell'
import Providers from './providers'
import './globals.css'

/** @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata */
export const metadata: Metadata = {
  title: 'nest-core-example',
  description:
    'Reference dashboard for @bymax-one/nest-core: the error envelope, request timing, offset and cursor pagination, health indicators, and metrics, all operable against the real API.',
}

interface RootLayoutProps {
  /** Page content rendered inside the shell. */
  children: React.ReactNode
}

/**
 * Root server component wrapping every page in the dashboard shell.
 *
 * @param children - Page content.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
