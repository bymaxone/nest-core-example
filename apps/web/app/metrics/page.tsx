/**
 * @fileoverview Metrics View.
 *
 * A raw Prometheus scrape panel (auto-refreshed every 5s, manual refresh
 * available), a parsed highlights panel, and a fire-traffic button so the
 * default HTTP metrics and the custom counter visibly grow.
 *
 * @layer screen
 */

'use client'

import { useQuery } from '@tanstack/react-query'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CARD_TITLE_CONTENT_CLASS,
} from '@/components/ui/card'
import { FireTraffic } from '@/components/metrics/fire-traffic'
import { Highlights } from '@/components/metrics/highlights'
import { RawScrape } from '@/components/metrics/raw-scrape'
import { getRawMetrics } from '@/lib/metrics-api'

/** Auto-refresh interval for the raw scrape, in milliseconds. */
const POLL_INTERVAL_MS = 5000

export default function MetricsPage() {
  const query = useQuery({
    queryKey: ['metrics', 'raw'],
    queryFn: getRawMetrics,
    refetchInterval: POLL_INTERVAL_MS,
  })

  const text = query.data?.ok ? query.data.data : undefined
  const errorMessage =
    query.data?.ok === false && query.data.kind === 'transport' ? query.data.message : undefined

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle as="h1" className={`text-xl ${CARD_TITLE_CONTENT_CLASS}`}>
            Metrics
          </CardTitle>
          <CardDescription>
            The Prometheus surface: default HTTP metrics fed by the timing bridge, process metrics,
            and the custom <code>catalog_lookups_total</code> counter.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-4 text-sm text-(--text-70)">
        Metrics are disabled by default in the library; this example enables them (
        <code className="font-mono text-xs">METRICS_ENABLED=true</code>). A 404 here means metrics
        are off and <code>prom-client</code> was never loaded.
      </div>

      {errorMessage !== undefined && (
        <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-4 font-mono text-sm text-(--color-danger)">
          {errorMessage}
        </div>
      )}

      <Highlights text={text} />

      <FireTraffic onFired={() => void query.refetch()} />

      <RawScrape text={text} onRefresh={() => void query.refetch()} refreshing={query.isFetching} />
    </div>
  )
}
