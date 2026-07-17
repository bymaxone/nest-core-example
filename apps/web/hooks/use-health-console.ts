/**
 * @fileoverview Owns the Health Console's polling queries and derives the
 * per-indicator values its display components need. Extracted from the
 * Health page so the page itself stays pure composition.
 *
 * @layer hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getLiveness, getReadiness } from '@/lib/health-api'

/** Polling interval for both health endpoints, in milliseconds. */
const POLL_INTERVAL_MS = 2000

/** React Query key for the readiness query, shared so toggles can invalidate it. */
export const HEALTH_READY_QUERY_KEY = ['health', 'ready'] as const

/** The reactive state the Health page renders. */
export interface HealthConsole {
  /** Liveness status, or undefined before the first fetch resolves. */
  readonly liveStatus: 'ok' | 'error' | undefined
  /** Readiness status, or undefined before the first fetch resolves. */
  readonly readyStatus: 'ok' | 'error' | undefined
  /** True while either the liveness or readiness query is pending its first fetch. */
  readonly loading: boolean
  /** The flaky indicator's current status, or undefined before readiness resolves. */
  readonly flakyStatus: 'up' | 'down' | undefined
  /** The hanging indicator's current status, or undefined before readiness resolves. */
  readonly hangStatus: 'up' | 'down' | undefined
  /** Every indicator's result, for the check list. */
  readonly checks: readonly {
    name: string
    status: 'up' | 'down'
    details?: Record<string, unknown>
  }[]
  /** Invalidates the readiness query so a toggle's effect is visible immediately. */
  readonly refreshReadiness: () => void
}

/**
 * Polls liveness and readiness, deriving the per-indicator values the
 * status tiles, toggles, and check list need.
 *
 * @returns The current health console state.
 */
export function useHealthConsole(): HealthConsole {
  const queryClient = useQueryClient()

  const live = useQuery({
    queryKey: ['health', 'live'],
    queryFn: getLiveness,
    refetchInterval: POLL_INTERVAL_MS,
  })
  const ready = useQuery({
    queryKey: HEALTH_READY_QUERY_KEY,
    queryFn: getReadiness,
    refetchInterval: POLL_INTERVAL_MS,
  })

  const readyData = ready.data?.ok ? ready.data.data : undefined
  const checks = readyData?.checks ?? []

  return {
    liveStatus: live.data?.ok ? live.data.data.status : undefined,
    readyStatus: readyData?.status,
    loading: live.isPending || ready.isPending,
    flakyStatus: checks.find((check) => check.name === 'flaky')?.status,
    hangStatus: checks.find((check) => check.name === 'hanging')?.status,
    checks,
    refreshReadiness: () => {
      void queryClient.invalidateQueries({ queryKey: HEALTH_READY_QUERY_KEY })
    },
  }
}
