/**
 * @fileoverview Client providers tree: TanStack Query + Toaster.
 *
 * This is the only `'use client'` boundary in the root layout tree. The root
 * `app/layout.tsx` remains a server component; this file establishes the
 * QueryClient every page's `useQuery`/`useMutation` calls read from.
 *
 * @layer providers
 */

'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from '@/components/ui/sonner'

interface ProvidersProps {
  /** Page or layout content rendered inside the provider tree. */
  children: ReactNode
}

/**
 * Root client provider that wires the TanStack Query client and toast system.
 *
 * The `QueryClient` is created once per component instance via `useState`'s
 * lazy initializer, so a server-rendered request never leaks its cache into
 * the next one and a client-side mount never recreates it on re-render.
 *
 * @param children - Page or nested layout content.
 */
export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
