/**
 * @fileoverview Parsed highlights panel: total HTTP requests, the duration
 * histogram's bucket count, and the custom `catalog_lookups_total` counter.
 *
 * @layer components/metrics
 */

import { StatTile } from '@/components/shared/stat-tile'
import { findMetricSamples, sumMetricValue } from '@/lib/metrics-api'

interface HighlightsProps {
  /** The raw Prometheus exposition text, or undefined while loading. */
  text: string | undefined
}

/**
 * Three highlighted metrics parsed from the raw scrape.
 *
 * @param text - The raw Prometheus exposition text.
 */
export function Highlights({ text }: HighlightsProps) {
  const loading = text === undefined
  const requestTotal = loading ? 0 : sumMetricValue(text, 'http_requests_total')
  const bucketCount = loading
    ? 0
    : findMetricSamples(text, 'http_request_duration_seconds_bucket').length
  const lookupTotal = loading ? 0 : sumMetricValue(text, 'catalog_lookups_total')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile label="http_requests_total" value={requestTotal} loading={loading} />
      <StatTile label="duration buckets" value={bucketCount} loading={loading} />
      <StatTile label="catalog_lookups_total" value={lookupTotal} loading={loading} />
    </div>
  )
}
