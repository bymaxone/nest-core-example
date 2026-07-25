/**
 * @fileoverview Raw Prometheus scrape panel: mono text, manual refresh.
 *
 * Pure presentational: the Metrics page owns the polling query and the
 * refresh action; this component only renders what it is given.
 *
 * @layer components/metrics
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RawScrapeProps {
  /** The raw Prometheus exposition text, or undefined while loading. */
  text: string | undefined
  /** Manually triggers a refetch. */
  onRefresh: () => void
  /** Disables the refresh button while a fetch is already in flight. */
  refreshing: boolean
}

/**
 * Scrollable mono panel showing the raw `/metrics` scrape.
 *
 * @param text - The raw Prometheus exposition text.
 * @param onRefresh - Manually triggers a refetch.
 * @param refreshing - Disables the button while a fetch is in flight.
 */
export function RawScrape({ text, onRefresh, refreshing }: RawScrapeProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Raw scrape</CardTitle>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="max-h-96 overflow-auto font-mono text-xs text-(--text-70)">
          {text ?? 'Loading...'}
        </pre>
      </CardContent>
    </Card>
  )
}
