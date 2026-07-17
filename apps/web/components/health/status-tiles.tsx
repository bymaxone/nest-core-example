/**
 * @fileoverview Liveness and readiness KPI tiles.
 *
 * Pure presentational: the Health page owns the polling queries and passes
 * their derived status down.
 *
 * @layer components/health
 */

import { StatTile } from '@/components/shared/stat-tile'
import { StatusChip } from '@/components/shared/status-chip'

interface StatusTilesProps {
  /** Liveness status, or undefined while the first fetch is pending. */
  liveStatus: 'ok' | 'error' | undefined
  /** Readiness status, or undefined while the first fetch is pending. */
  readyStatus: 'ok' | 'error' | undefined
  /** Shows loading skeletons for both tiles. */
  loading: boolean
}

/**
 * Two-tile strip: liveness and readiness, each a status chip.
 *
 * @param liveStatus - Liveness status.
 * @param readyStatus - Readiness status.
 * @param loading - Shows loading skeletons for both tiles.
 */
export function StatusTiles({ liveStatus, readyStatus, loading }: StatusTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatTile
        label="Liveness"
        value={
          liveStatus ? <StatusChip severity={liveStatus} label={liveStatus.toUpperCase()} /> : '...'
        }
        loading={loading}
      />
      <StatTile
        label="Readiness"
        value={
          readyStatus ? (
            <StatusChip severity={readyStatus} label={readyStatus.toUpperCase()} />
          ) : (
            '...'
          )
        }
        loading={loading}
      />
    </div>
  )
}
