/**
 * @fileoverview KPI tile — the design system's `stat` pattern (label, mono
 * value, optional hint), used for the Overview status strip.
 *
 * @layer components/shared
 */

import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { severityStyle, type Severity } from '@/lib/severity'

interface StatTileProps {
  /** Short uppercase label describing the metric. */
  label: string
  /** The metric's current value, rendered in mono. */
  value: ReactNode
  /** Optional secondary line under the value. */
  hint?: ReactNode
  /** When set, colors the value per the severity scale. */
  severity?: Severity
  /** Shows a skeleton in place of the value while the backing query loads. */
  loading?: boolean
}

/**
 * Single KPI tile: label, mono value (or loading skeleton), optional hint.
 *
 * @param label - Short uppercase label describing the metric.
 * @param value - The metric's current value.
 * @param hint - Optional secondary line under the value.
 * @param severity - Optional severity coloring the value.
 * @param loading - Shows a skeleton instead of the value while loading.
 */
export function StatTile({ label, value, hint, severity, loading = false }: StatTileProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-20" />
        ) : (
          <div
            className={cn(
              'mt-1 font-mono text-2xl font-bold',
              severity ? severityStyle(severity).textClassName : 'text-foreground',
            )}
          >
            {value}
          </div>
        )}
        {hint !== undefined && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}
