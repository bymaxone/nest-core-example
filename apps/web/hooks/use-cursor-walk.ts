/**
 * @fileoverview Owns the Pagination page's cursor-walk state: accumulated
 * items, the cursor trail, the end-of-catalog flag, and the corrupt-cursor
 * demonstration. Extracted from `CursorTable` so the component itself stays
 * pure composition of the smaller display pieces.
 *
 * @layer hooks
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { listCursorProducts, type Product } from '@/lib/catalog-api'
import type { ErrorEnvelope } from '@/lib/envelope'

/** Page size for each cursor "load more" call. */
const CURSOR_PAGE_LIMIT = 10

/** Fallback seed cursor used to build a tampered value before any real page has loaded. */
const FALLBACK_SEED_CURSOR = 'eyJpZCI6InAtMDAwMDAxIn0'

/**
 * Reverse a cursor and append a stray character, guaranteeing it fails
 * base64url decoding or JSON parsing server-side.
 *
 * @param cursor - A real or fallback cursor to tamper with.
 * @returns A deliberately corrupted cursor string.
 */
function tamperCursor(cursor: string): string {
  return `${cursor.split('').reverse().join('')}x`
}

/** The reactive state and actions `CursorTable` renders. */
export interface CursorWalk {
  /** Every product accumulated across all "Load more" clicks so far. */
  readonly items: readonly Product[]
  /** Every cursor used so far, in walk order. */
  readonly cursors: readonly string[]
  /** True once `nextCursor: null` has been reached. */
  readonly isEnd: boolean
  /** True while a load-more request is in flight. */
  readonly isLoadingMore: boolean
  /** True while the corrupt-cursor request is in flight. */
  readonly isCorrupting: boolean
  /** The envelope returned by the last corrupt-cursor attempt, or null. */
  readonly corruptEnvelope: ErrorEnvelope | null
  /** Fires the next load-more request. */
  readonly loadMore: () => void
  /** Fires the corrupt-cursor request. */
  readonly corrupt: () => void
}

/**
 * Cursor-walk state machine: accumulation, cursor trail, and the
 * corrupt-cursor demonstration.
 *
 * @returns The current walk state and its two actions.
 */
export function useCursorWalk(): CursorWalk {
  const [items, setItems] = useState<Product[]>([])
  const [cursors, setCursors] = useState<string[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [corruptEnvelope, setCorruptEnvelope] = useState<ErrorEnvelope | null>(null)

  const isEnd = hasStarted && nextCursor === null

  const loadMore = useMutation({
    mutationFn: (cursor: string | undefined) => listCursorProducts(cursor, CURSOR_PAGE_LIMIT),
    onSuccess: (result, cursor) => {
      if (!result.ok) {
        return
      }
      setItems((previous) => [...previous, ...result.data.items])
      setNextCursor(result.data.nextCursor)
      setHasStarted(true)
      if (cursor !== undefined) {
        setCursors((previous) => [...previous, cursor])
      }
    },
  })

  const corrupt = useMutation({
    mutationFn: () =>
      listCursorProducts(tamperCursor(cursors.at(-1) ?? FALLBACK_SEED_CURSOR), CURSOR_PAGE_LIMIT),
    onSuccess: (result) => {
      if (!result.ok && result.kind === 'envelope') {
        setCorruptEnvelope(result.error)
      }
    },
  })

  return {
    items,
    cursors,
    isEnd,
    isLoadingMore: loadMore.isPending,
    isCorrupting: corrupt.isPending,
    corruptEnvelope,
    loadMore: () => loadMore.mutate(nextCursor ?? undefined),
    corrupt: () => corrupt.mutate(),
  }
}
