/**
 * @fileoverview Infinite "load more" cursor table plus the corrupt-cursor
 * demonstration: tampering the last-used cursor and rendering the resulting
 * `BYMAX_VALIDATION_FAILED` envelope inline.
 *
 * @layer components/pagination
 */

'use client'

import { EnvelopeViewer } from '@/components/shared/envelope-viewer'
import { useCursorWalk } from '@/hooks/use-cursor-walk'
import { CursorControls } from './cursor-controls'
import { CursorTrail } from './cursor-trail'
import { ProductTable } from './product-table'

/** Shown in the table's empty state before the first "Load more" click. */
const EMPTY_MESSAGE = 'Nothing loaded yet. Click "Load more" to start walking the catalog.'

/**
 * Cursor-paginated product table with load-more accumulation and the
 * corrupt-cursor demo.
 */
export function CursorTable() {
  const walk = useCursorWalk()

  return (
    <div className="flex flex-col gap-4">
      <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-3 text-xs text-(--text-70)">
        Cursors are opaque ordering keys, unsigned, never secrets.
      </div>

      <CursorTrail cursors={walk.cursors} />

      <ProductTable items={walk.items} emptyMessage={EMPTY_MESSAGE} />

      <CursorControls
        isEnd={walk.isEnd}
        isLoadingMore={walk.isLoadingMore}
        isCorrupting={walk.isCorrupting}
        onLoadMore={walk.loadMore}
        onCorrupt={walk.corrupt}
      />

      {walk.corruptEnvelope !== null && (
        <div>
          <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Corrupt-cursor response
          </h3>
          <EnvelopeViewer envelope={walk.corruptEnvelope} />
        </div>
      )}
    </div>
  )
}
