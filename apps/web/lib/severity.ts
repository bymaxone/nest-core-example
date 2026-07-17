/**
 * @fileoverview Severity mapping shared by every status/level surface.
 *
 * A single `ok | warn | error` scale drives the dot color, text color, and
 * label used by `StatusChip`, the Health Console's `CheckList`, and the
 * Latency Lab's `SampleFeed` slow/status badges, so the dashboard encodes
 * severity identically everywhere per the design system's "color + icon +
 * text together" rule.
 *
 * @layer utility
 */

/** The three-point severity scale used across the dashboard. */
export type Severity = 'ok' | 'warn' | 'error'

/** Visual treatment for one severity level. */
export interface SeverityStyle {
  /** Short uppercase label shown next to the dot. */
  readonly label: string
  /** Tailwind class painting the status dot. */
  readonly dotClassName: string
  /** Tailwind class painting the label text. */
  readonly textClassName: string
}

/** Severity -> visual treatment, using the design system's status colors. */
const SEVERITY_STYLES: Readonly<Record<Severity, SeverityStyle>> = {
  ok: {
    label: 'OK',
    dotClassName: 'bg-(--color-success)',
    textClassName: 'text-(--color-success)',
  },
  warn: {
    label: 'WARN',
    dotClassName: 'bg-(--color-accent)',
    textClassName: 'text-(--color-accent)',
  },
  error: {
    label: 'ERROR',
    dotClassName: 'bg-(--color-danger)',
    textClassName: 'text-(--color-danger)',
  },
}

/**
 * Look up the visual treatment for a severity level.
 *
 * @param severity - One of the three severity levels.
 * @returns The label and Tailwind classes for that level.
 */
export function severityStyle(severity: Severity): SeverityStyle {
  return SEVERITY_STYLES[severity]
}

/**
 * Map a health indicator's `up`/`down` status to a severity.
 *
 * @param status - The indicator or aggregate health status.
 * @returns `'ok'` for `up`, `'error'` for `down`.
 */
export function severityForHealthStatus(status: 'up' | 'down'): Severity {
  return status === 'up' ? 'ok' : 'error'
}

/**
 * Map an HTTP status code to a severity for the timing sample feed.
 *
 * @param statusCode - The response's final HTTP status code.
 * @returns `'error'` for 5xx, `'warn'` for 4xx, `'ok'` otherwise.
 */
export function severityForHttpStatus(statusCode: number): Severity {
  if (statusCode >= 500) {
    return 'error'
  }
  if (statusCode >= 400) {
    return 'warn'
  }
  return 'ok'
}
