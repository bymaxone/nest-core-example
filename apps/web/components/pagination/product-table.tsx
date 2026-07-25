/**
 * @fileoverview Shared product rows table, reused by the offset and cursor
 * tabs. Both tabs render the same four columns: the two pagination models
 * differ in how a page is addressed, not in what a product is, so showing
 * different columns per tab would read as a difference the library does not
 * have.
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

/** Number of columns rendered, spanned by the empty-state row. */
const COLUMN_COUNT = 4

interface ProductTableProps {
  /** The products to render, in display order. */
  items: readonly Product[]
  /** Message shown in the empty-state row when `items` is empty. */
  emptyMessage: string
}

/**
 * Product rows table with an action-oriented empty state.
 *
 * @param items - The products to render.
 * @param emptyMessage - Message shown when `items` is empty.
 */
export function ProductTable({ items, emptyMessage }: ProductTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Id</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMN_COUNT} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono">{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell className="font-mono">{formatPrice(item.priceCents)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
