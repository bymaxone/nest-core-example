/**
 * @fileoverview The chain of opaque cursors walked so far, each copyable.
 *
 * Cursors are opaque ordering keys, never secrets: showing and copying them
 * is safe, and doing so makes the opaque-but-not-signed contract tangible.
 *
 * @layer components/pagination
 */

'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface CursorTrailProps {
  /** Every cursor used so far, in walk order. */
  cursors: readonly string[]
}

/**
 * Copy a cursor to the clipboard and confirm it with a toast.
 *
 * @param cursor - The cursor string to copy.
 */
function handleCopy(cursor: string): void {
  void navigator.clipboard.writeText(cursor).then(() => {
    toast.success('Cursor copied')
  })
}

/**
 * Row of chips, one per cursor walked so far.
 *
 * @param cursors - Every cursor used so far, in walk order.
 */
export function CursorTrail({ cursors }: CursorTrailProps) {
  if (cursors.length === 0) {
    return <p className="text-xs text-muted-foreground">No cursors walked yet.</p>
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="Cursor trail">
      {cursors.map((cursor, index) => (
        <button
          key={`${String(index)}-${cursor}`}
          type="button"
          onClick={() => handleCopy(cursor)}
          title="Copy cursor"
          className="border-(--glass-border) bg-(--glass-bg) hover:bg-(--glass-bg-hover) inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs text-(--text-70)"
        >
          <span className="text-(--color-secondary)">#{index + 1}</span>
          <span className="max-w-32 truncate">{cursor}</span>
          <Copy className="h-3 w-3" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
