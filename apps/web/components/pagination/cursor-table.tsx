/**
 * @fileoverview Infinite "load more" cursor table plus the corrupt-cursor
 * demonstration: tampering the last-used cursor and rendering the resulting
 * `BYMAX_VALIDATION_FAILED` envelope inline.
 *
 * @layer components/pagination
 */

'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EnvelopeViewer } from '@/components/shared/envelope-viewer'
import { listCursorProducts, type Product } from '@/lib/catalog-api'
import type { ErrorEnvelope } from '@/lib/envelope'
import { CursorTrail } from './cursor-trail'

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

/**
 * Cursor-paginated product table with load-more accumulation and the
 * corrupt-cursor demo.
 */
export function CursorTable() {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-3 text-xs text-(--text-70)">
        Cursors are opaque ordering keys, unsigned, never secrets.
      </div>

      <CursorTrail cursors={cursors} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nothing loaded yet. Click "Load more" to start walking the catalog.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {isEnd && (
        <p className="text-center font-mono text-xs text-muted-foreground">
          End of catalog: nextCursor is null.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => loadMore.mutate(nextCursor ?? undefined)}
          disabled={loadMore.isPending || isEnd}
        >
          {loadMore.isPending ? 'Loading...' : 'Load more'}
        </Button>
        <Button variant="outline" onClick={() => corrupt.mutate()} disabled={corrupt.isPending}>
          {corrupt.isPending ? 'Corrupting...' : 'Corrupt the cursor'}
        </Button>
      </div>

      {corruptEnvelope !== null && (
        <div>
          <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Corrupt-cursor response
          </h3>
          <EnvelopeViewer envelope={corruptEnvelope} />
        </div>
      )}
    </div>
  )
}
