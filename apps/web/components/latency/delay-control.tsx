/**
 * @fileoverview Delay slider + fire button driving `GET /latency?ms=`.
 *
 * On a successful fire, invalidates the timing-samples query so the sample
 * feed picks up the new row on its next poll (or immediately, via refetch).
 *
 * @layer components/latency
 */

'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { fireDelay } from '@/lib/latency-api'

/** Lowest selectable delay, in milliseconds. */
const MIN_DELAY_MS = 0
/** Highest selectable delay, in milliseconds (matches the design system's slider range). */
const MAX_DELAY_MS = 2000
/** Slider step size, in milliseconds. */
const DELAY_STEP_MS = 50
/** Default slider position on first render. */
const DEFAULT_DELAY_MS = 500

/** React Query key shared with the sample feed, invalidated after a fire. */
export const TIMING_SAMPLES_QUERY_KEY = ['timing', 'samples'] as const

/**
 * Slider + fire button for the artificial-delay endpoint.
 */
export function DelayControl() {
  const [delayMs, setDelayMs] = useState(DEFAULT_DELAY_MS)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => fireDelay(delayMs),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(
          `Fired ${String(result.data.requestedMs)}ms, elapsed ${String(result.data.elapsedMs)}ms`,
        )
        void queryClient.invalidateQueries({ queryKey: TIMING_SAMPLES_QUERY_KEY })
      } else if (result.kind === 'transport') {
        toast.error(result.message)
      }
    },
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor="delay-slider" className="font-mono text-sm text-muted-foreground">
          Delay
        </label>
        <span className="font-mono text-sm font-semibold">{delayMs} ms</span>
      </div>
      <input
        id="delay-slider"
        type="range"
        min={MIN_DELAY_MS}
        max={MAX_DELAY_MS}
        step={DELAY_STEP_MS}
        value={delayMs}
        onChange={(event) => setDelayMs(Number(event.target.value))}
        className="accent-brand-500 w-full"
      />
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? 'Firing…' : 'Fire request'}
      </Button>
    </div>
  )
}
