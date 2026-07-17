/**
 * @fileoverview Raw `meta` object rendered in mono, honest about exactly
 * what the offset endpoint returned (no relabeling or reshaping).
 *
 * @layer components/pagination
 */

import type { PageMeta } from '@/lib/catalog-api'

interface RawMetaPanelProps {
  /** The page meta to render as raw JSON. */
  meta: PageMeta
}

/**
 * Glass panel showing the raw `meta` object as pretty-printed JSON.
 *
 * @param meta - The page meta to render.
 */
export function RawMetaPanel({ meta }: RawMetaPanelProps) {
  return (
    <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-3">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Raw meta
      </p>
      <pre className="overflow-x-auto font-mono text-xs text-(--text-70)">
        {JSON.stringify(meta, null, 2)}
      </pre>
    </div>
  )
}
