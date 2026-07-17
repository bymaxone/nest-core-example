/**
 * @fileoverview Shared product rows table, reused by the offset and cursor
 * tabs. The offset tab additionally shows price; the cursor tab does not,
 * since it accumulates many rows and keeps to the columns relevant to the
 * walk.
 *
 * @layer components/pagination
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Product } from '@/lib/catalog-api'

/**
 * Format integer cents as a dollar amount.
 *
 * @param priceCents - Price in integer cents.
 * @returns A `$X.XX` formatted string.
 */
function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`
}

interface ProductTableProps {
  /** The products to render, in display order. */
  items: readonly Product[]
  /** Message shown in the empty-state row when `items` is empty. */
  emptyMessage: string
  /** Adds a price column when true. */
  hasPriceColumn?: boolean
}

/**
 * Product rows table with an action-oriented empty state.
 *
 * @param items - The products to render.
 * @param emptyMessage - Message shown when `items` is empty.
 * @param hasPriceColumn - Adds a price column when true.
 */
export function ProductTable({ items, emptyMessage, hasPriceColumn = false }: ProductTableProps) {
  const columnCount = hasPriceColumn ? 4 : 3

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Id</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          {hasPriceColumn && <TableHead>Price</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono">{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              {hasPriceColumn && (
                <TableCell className="font-mono">{formatPrice(item.priceCents)}</TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
