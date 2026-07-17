/**
 * @fileoverview Classic numbered offset table: page/limit controls, the
 * product rows, and the raw `meta` object rendered in mono for honesty about
 * exactly what the API returned.
 *
 * @layer components/pagination
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listOffsetProducts } from '@/lib/catalog-api'

/** Selectable page-size options for the limit control. */
const LIMIT_OPTIONS = [5, 10, 20, 50] as const

/**
 * Format integer cents as a dollar amount.
 *
 * @param priceCents - Price in integer cents.
 * @returns A `$X.XX` formatted string.
 */
function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`
}

/**
 * Offset-paginated product table with page/limit controls.
 */
export function OffsetTable() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<(typeof LIMIT_OPTIONS)[number]>(10)

  const query = useQuery({
    queryKey: ['catalog', 'offset', page, limit],
    queryFn: () => listOffsetProducts(page, limit),
  })

  const data = query.data?.ok ? query.data.data : undefined
  const items = data?.items ?? []
  const meta = data?.meta
  const isLastPage = meta !== undefined && page >= meta.totalPages

  const handleLimitChange = (value: string) => {
    setLimit(Number(value) as (typeof LIMIT_OPTIONS)[number])
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="offset-limit" className="font-mono text-sm text-muted-foreground">
          Limit
        </label>
        <Select value={String(limit)} onValueChange={handleLimitChange}>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <span className="font-mono text-sm">
            Page {meta?.page ?? page} / {meta?.totalPages ?? '...'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => current + 1)}
            disabled={isLastPage}
          >
            Next
          </Button>
        </div>
      </div>

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
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {query.isPending ? 'Loading...' : 'No products on this page.'}
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

      {meta !== undefined && (
        <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-3">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Raw meta
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-(--text-70)">
            {JSON.stringify(meta, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
