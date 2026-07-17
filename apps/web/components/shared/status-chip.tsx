/**
 * @fileoverview Small pill combining a severity dot, color, and text label.
 *
 * Reused wherever a status needs to be shown compactly: the Overview status
 * strip, the Health Console's check list, and the Latency Lab's sample feed.
 * Encodes severity with color, position (dot), and text together — never
 * color alone — per the design system's accessible-severity rule.
 *
 * @layer components/shared
 */

import { cn } from '@/lib/utils'
import { severityStyle, type Severity } from '@/lib/severity'

interface StatusChipProps {
  /** The severity level to render. */
  severity: Severity
  /** Overrides the default label (`OK`/`WARN`/`ERROR`) with custom text. */
  label?: string
}

/**
 * Glass pill showing a colored dot next to a severity label.
 *
 * @param severity - The severity level driving color and default label.
 * @param label - Optional custom text replacing the default label.
 */
export function StatusChip({ severity, label }: StatusChipProps) {
  const style = severityStyle(severity)
  return (
    <span className="border-(--glass-border) bg-(--glass-bg) inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px]">
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dotClassName)} aria-hidden="true" />
      <span className={style.textClassName}>{label ?? style.label}</span>
    </span>
  )
}
