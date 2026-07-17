/**
 * @fileoverview Pagination page: offset and cursor tabs over the seeded
 * catalog, plus the corrupt-cursor strict-rejection demo.
 *
 * @layer screen
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CursorTable } from '@/components/pagination/cursor-table'
import { OffsetTable } from '@/components/pagination/offset-table'

export default function PaginationPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader accent>
          <CardTitle>Pagination</CardTitle>
          <CardDescription>
            Walk the seeded catalog with clamped offset pages and with opaque cursors, side by side.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-5">
          <Tabs defaultValue="offset">
            <TabsList>
              <TabsTrigger value="offset">Offset</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
            </TabsList>
            <TabsContent value="offset">
              <OffsetTable />
            </TabsContent>
            <TabsContent value="cursor">
              <CursorTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
