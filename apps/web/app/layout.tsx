/**
 * @fileoverview Root layout: HTML shell and font loading.
 *
 * Uses Geist Sans + Geist Mono from the `geist` package. The font CSS
 * variables are injected into `<html>` and consumed by globals.css. Forced
 * dark: no theme toggle, no `next-themes`.
 *
 * Neither the client provider boundary nor the dashboard shell is applied here;
 * both live in `app/dashboard/layout.tsx`. That keeps the public landing page at
 * `/` free of the topbar and sidebar, and fully server-rendered: the query
 * client never ships to a visitor who only reads the marketing surface.
 *
 * @layer layouts
 */

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import './globals.css'

/** @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata */
export const metadata: Metadata = {
  title: 'nest-core-example',
  description:
    'Reference dashboard for @bymax-one/nest-core: the error envelope, request timing, offset and cursor pagination, health indicators, and metrics, all operable against the real API.',
}

interface RootLayoutProps {
  /** Page or nested layout subtree. */
  children: React.ReactNode
}

/**
 * Root server component: the HTML document shell.
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
      <body>{children}</body>
    </html>
  )
}
