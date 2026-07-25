/**
 * @fileoverview The Metrics View's two traffic generators: a burst of catalog
 * list requests that grows the library's default `http_requests_total`, and a
 * single custom-counter lookup that grows `catalog_lookups_total` on the
 * injected `BYMAX_METRICS_REGISTRY`.
 *
 * @layer components/metrics
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { listOffsetProducts } from '@/lib/catalog-api'
import { recordCatalogLookup } from '@/lib/metrics-api'

/** Number of catalog requests fired per click. */
const TRAFFIC_BURST_SIZE = 10

/**
 * Fire {@link TRAFFIC_BURST_SIZE} catalog list requests concurrently.
 *
 * @returns The number of requests that resolved successfully.
 */
async function fireBurst(): Promise<number> {
  const results = await Promise.all(
    Array.from({ length: TRAFFIC_BURST_SIZE }, () => listOffsetProducts(1, 5)),
  )
  return results.filter((result) => result.ok).length
}

interface FireTrafficProps {
  /** Called after either action completes so the parent can refetch the scrape. */
  onFired: () => void
}

/**
 * The two metric-driving actions, side by side.
 *
 * The catalog burst only moves the library's built-in HTTP metrics; the
 * lookup is the one control that exercises a consumer-registered metric, so
 * both are offered rather than leaving `catalog_lookups_total` stuck at zero.
 *
 * @param onFired - Called after either action completes.
 */
export function FireTraffic({ onFired }: FireTrafficProps) {
  const burst = useMutation({
    mutationFn: fireBurst,
    onSuccess: (succeeded) => {
      toast.success(`Fired ${String(TRAFFIC_BURST_SIZE)} requests, ${String(succeeded)} succeeded`)
      onFired()
    },
  })

  const lookup = useMutation({
    mutationFn: recordCatalogLookup,
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`catalog_lookups_total is now ${String(result.data.total)}`)
        onFired()
      } else if (result.kind === 'transport') {
        toast.error(result.message)
      }
    },
  })

  const busy = burst.isPending || lookup.isPending

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => burst.mutate()} disabled={busy}>
        {burst.isPending ? 'Firing traffic...' : `Fire ${String(TRAFFIC_BURST_SIZE)} requests`}
      </Button>
      <Button variant="outline" onClick={() => lookup.mutate()} disabled={busy}>
        {lookup.isPending ? 'Recording lookup...' : 'Record catalog lookup'}
      </Button>
    </div>
  )
}
