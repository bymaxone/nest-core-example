/**
 * @fileoverview Load-more and corrupt-cursor action buttons, plus the
 * end-of-catalog state message.
 *
 * @layer components/pagination
 */

import { Button } from '@/components/ui/button'

interface CursorControlsProps {
  /** True once `nextCursor: null` has been reached; disables Load more. */
  isEnd: boolean
  /** True while a load-more request is in flight. */
  isLoadingMore: boolean
  /** True while the corrupt-cursor request is in flight. */
  isCorrupting: boolean
  /** Fires the next load-more request. */
  onLoadMore: () => void
  /** Fires the corrupt-cursor request. */
  onCorrupt: () => void
}

/**
 * Load more / corrupt the cursor buttons, with the end-of-catalog message.
 *
 * @param isEnd - True once `nextCursor: null` has been reached.
 * @param isLoadingMore - True while a load-more request is in flight.
 * @param isCorrupting - True while the corrupt-cursor request is in flight.
 * @param onLoadMore - Fires the next load-more request.
 * @param onCorrupt - Fires the corrupt-cursor request.
 */
export function CursorControls({
  isEnd,
  isLoadingMore,
  isCorrupting,
  onLoadMore,
  onCorrupt,
}: CursorControlsProps) {
  return (
    <>
      {isEnd && (
        <p className="text-center font-mono text-xs text-muted-foreground">
          End of catalog: nextCursor is null.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onLoadMore} disabled={isLoadingMore || isEnd}>
          {isLoadingMore ? 'Loading...' : 'Load more'}
        </Button>
        <Button variant="outline" onClick={onCorrupt} disabled={isCorrupting}>
          {isCorrupting ? 'Corrupting...' : 'Corrupt the cursor'}
        </Button>
      </div>
    </>
  )
}
