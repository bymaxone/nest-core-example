/**
 * @fileoverview Inline SVG sparkline of the last 50 samples' duration.
 *
 * Pure presentational: normalizes durations against the batch's own max so
 * the line always fills the available height, regardless of absolute scale.
 *
 * @layer components/latency
 */

import type { RequestTimingSample } from '@/lib/timing-api'

/** Maximum number of trailing samples plotted. */
const MAX_POINTS = 50
/** SVG viewBox width, in user units. */
const SPARK_WIDTH = 300
/** SVG viewBox height, in user units. */
const SPARK_HEIGHT = 48

interface DurationSparklineProps {
  /** The recent timing samples, oldest first; only the last 50 are plotted. */
  samples: readonly RequestTimingSample[]
}

/**
 * Build the SVG `points` attribute for a batch of durations, normalized to
 * the batch's own maximum so the tallest point always touches the top edge.
 *
 * @param durations - Duration values in milliseconds, oldest first.
 * @returns A space-separated `x,y` point list.
 */
function buildPoints(durations: readonly number[]): string {
  const max = Math.max(...durations, 1)
  const lastIndex = Math.max(durations.length - 1, 1)
  return durations
    .map((durationMs, index) => {
      const x = (index / lastIndex) * SPARK_WIDTH
      const y = SPARK_HEIGHT - (durationMs / max) * SPARK_HEIGHT
      return `${x},${y}`
    })
    .join(' ')
}

/**
 * Sparkline of the last 50 samples' `durationMs`.
 *
 * @param samples - The recent timing samples, oldest first.
 */
export function DurationSparkline({ samples }: DurationSparklineProps) {
  const recent = samples.slice(-MAX_POINTS)

  if (recent.length === 0) {
    return <p className="text-xs text-muted-foreground">No samples yet.</p>
  }

  return (
    <svg
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      className="h-12 w-full"
      role="img"
      aria-label={`Duration sparkline of the last ${String(recent.length)} samples`}
    >
      <polyline
        points={buildPoints(recent.map((sample) => sample.durationMs))}
        fill="none"
        stroke="#ff6224"
        strokeWidth={2}
      />
    </svg>
  )
}
