/**
 * @fileoverview Per-indicator status list: name, status chip, and any safe
 * diagnostic detail returned by the check.
 *
 * @layer components/health
 */

import { StatusChip } from '@/components/shared/status-chip'
import { severityForHealthStatus } from '@/lib/severity'
import type { HealthCheckEntry } from '@/lib/health-api'

interface CheckListProps {
  /** Every indicator's result, in aggregation order. */
  checks: readonly HealthCheckEntry[]
}

/**
 * List of health indicator results with per-row status chips.
 *
 * @param checks - Every indicator's result.
 */
export function CheckList({ checks }: CheckListProps) {
  if (checks.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No indicators reported (liveness carries none by design).
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {checks.map((check) => (
        <li
          key={check.name}
          className="border-(--glass-border) bg-(--glass-bg) flex items-center justify-between rounded-lg border px-3 py-2"
        >
          <div className="flex min-w-0 flex-col">
            <span className="font-mono text-sm font-semibold">{check.name}</span>
            {check.details !== undefined && (
              <span className="truncate font-mono text-xs text-muted-foreground">
                {JSON.stringify(check.details)}
              </span>
            )}
          </div>
          <StatusChip
            severity={severityForHealthStatus(check.status)}
            label={check.status.toUpperCase()}
          />
        </li>
      ))}
    </ul>
  )
}
