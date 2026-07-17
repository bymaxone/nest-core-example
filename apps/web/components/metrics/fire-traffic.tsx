/**
 * @fileoverview Fires a burst of catalog list requests, then refreshes the
 * metrics scrape so `http_requests_total` visibly grows.
 *
 * @layer components/metrics
 */

'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { listOffsetProducts } from '@/lib/catalog-api'

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
  /** Called after the burst completes so the parent can refetch the scrape. */
  onFired: () => void
}

/**
 * Button that fires a burst of catalog requests and refetches the scrape.
 *
 * @param onFired - Called after the burst completes.
 */
export function FireTraffic({ onFired }: FireTrafficProps) {
  const mutation = useMutation({
    mutationFn: fireBurst,
    onSuccess: (succeeded) => {
      toast.success(`Fired ${String(TRAFFIC_BURST_SIZE)} requests, ${String(succeeded)} succeeded`)
      onFired()
    },
  })

  return (
    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? 'Firing traffic...' : `Fire ${String(TRAFFIC_BURST_SIZE)} requests`}
    </Button>
  )
}
