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

import { listOffsetProducts } from '@/lib/catalog-api'
import { LIMIT_OPTIONS, OffsetControls } from './offset-controls'
import { ProductTable } from './product-table'
import { RawMetaPanel } from './raw-meta-panel'

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

  const handleLimitChange = (value: string) => {
    setLimit(Number(value) as (typeof LIMIT_OPTIONS)[number])
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <OffsetControls
        page={page}
        limit={limit}
        meta={meta}
        onLimitChange={handleLimitChange}
        onPrev={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => current + 1)}
      />

      <ProductTable
        items={items}
        emptyMessage={query.isPending ? 'Loading...' : 'No products on this page.'}
        hasPriceColumn
      />

      {meta !== undefined && <RawMetaPanel meta={meta} />}
    </div>
  )
}
