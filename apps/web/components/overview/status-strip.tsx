/**
 * @fileoverview The Overview page's four-tile status strip: readiness,
 * request count, slow count, and error count.
 *
 * @layer components/overview
 */

import { StatTile } from '@/components/shared/stat-tile'
import { StatusChip } from '@/components/shared/status-chip'
import type { TimingSummary } from '@/lib/timing-api'

interface StatusStripProps {
  /** Current readiness status, or undefined before the first fetch resolves. */
  healthStatus: 'ok' | 'error' | undefined
  /** Derived request/slow/error counts from the timing samples feed. */
  summary: TimingSummary
  /** Shows the readiness tile's loading skeleton. */
  readinessLoading: boolean
  /** Shows the three timing-derived tiles' loading skeletons. */
  timingLoading: boolean
}

/**
 * Four-tile KPI strip: readiness, requests, slow requests, error responses.
 *
 * @param healthStatus - Current readiness status.
 * @param summary - Derived request/slow/error counts.
 * @param readinessLoading - Shows the readiness tile's loading skeleton.
 * @param timingLoading - Shows the timing-derived tiles' loading skeletons.
 */
export function StatusStrip({
  healthStatus,
  summary,
  readinessLoading,
  timingLoading,
}: StatusStripProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile
        label="Readiness"
        value={
          healthStatus ? (
            <StatusChip severity={healthStatus} label={healthStatus.toUpperCase()} />
          ) : (
            '...'
          )
        }
        loading={readinessLoading}
      />
      <StatTile label="Requests" value={summary.total} loading={timingLoading} />
      <StatTile
        label="Slow requests"
        value={summary.slow}
        severity={summary.slow > 0 ? 'warn' : 'ok'}
        loading={timingLoading}
      />
      <StatTile
        label="Error responses"
        value={summary.errors}
        severity={summary.errors > 0 ? 'error' : 'ok'}
        loading={timingLoading}
      />
    </div>
  )
}
