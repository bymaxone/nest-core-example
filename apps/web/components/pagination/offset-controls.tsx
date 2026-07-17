/**
 * @fileoverview Limit select and prev/next controls for the offset table.
 *
 * @layer components/pagination
 */

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PageMeta } from '@/lib/catalog-api'

/** Selectable page-size options for the limit control. */
export const LIMIT_OPTIONS = [5, 10, 20, 50] as const

interface OffsetControlsProps {
  /** The current page number (may be stale relative to `meta` mid-fetch). */
  page: number
  /** The current limit selection. */
  limit: (typeof LIMIT_OPTIONS)[number]
  /** The last-fetched page meta, or undefined before the first response. */
  meta: PageMeta | undefined
  /** Called with the new limit's string value. */
  onLimitChange: (value: string) => void
  /** Moves to the previous page, clamped to 1 by the caller. */
  onPrev: () => void
  /** Moves to the next page. */
  onNext: () => void
}

/**
 * Limit select plus prev/next page controls, clamped from the response meta.
 *
 * @param page - The current page number.
 * @param limit - The current limit selection.
 * @param meta - The last-fetched page meta.
 * @param onLimitChange - Called with the new limit's string value.
 * @param onPrev - Moves to the previous page.
 * @param onNext - Moves to the next page.
 */
export function OffsetControls({
  page,
  limit,
  meta,
  onLimitChange,
  onPrev,
  onNext,
}: OffsetControlsProps) {
  const isLastPage = meta !== undefined && page >= meta.totalPages

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="offset-limit" className="font-mono text-sm text-muted-foreground">
        Limit
      </label>
      <Select value={String(limit)} onValueChange={onLimitChange}>
        <SelectTrigger id="offset-limit" className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LIMIT_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          Prev
        </Button>
        <span className="font-mono text-sm">
          Page {meta?.page ?? page} / {meta?.totalPages ?? '...'}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={isLastPage}>
          Next
        </Button>
      </div>
    </div>
  )
}
