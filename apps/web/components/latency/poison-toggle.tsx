/**
 * @fileoverview Poison-the-sink demonstration.
 *
 * Arms the demo sink's one-shot failure, then immediately fires a plain
 * follow-up request and toasts its outcome: proving a broken sink write
 * never breaks the request it was recording.
 *
 * @layer components/latency
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { fireDelay } from '@/lib/latency-api'
import { poisonTimingSink } from '@/lib/timing-api'
import { TIMING_SAMPLES_QUERY_KEY } from './delay-control'

/**
 * Arm the sink poison, then fire a follow-up request and report whether it
 * still succeeded.
 *
 * @returns The follow-up request's outcome, for the toast message.
 */
async function poisonThenVerify(): Promise<{ succeeded: boolean; detail: string }> {
  const poisonResult = await poisonTimingSink()
  if (!poisonResult.ok) {
    return { succeeded: false, detail: 'Failed to arm the sink poison.' }
  }

  const followUp = await fireDelay(0, false)
  if (followUp.ok) {
    return {
      succeeded: true,
      detail: `Sink poisoned, but the next request still returned ${String(followUp.data.elapsedMs)}ms elapsed.`,
    }
  }
  return { succeeded: false, detail: 'The follow-up request unexpectedly failed.' }
}

/**
 * Button that poisons the demo sink and verifies the next request survives it.
 */
export function PoisonToggle() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: poisonThenVerify,
    onSuccess: (outcome) => {
      if (outcome.succeeded) {
        toast.success(outcome.detail)
      } else {
        toast.error(outcome.detail)
      }
      void queryClient.invalidateQueries({ queryKey: TIMING_SAMPLES_QUERY_KEY })
    },
  })

  return (
    <Button
      variant="outline"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="w-full"
    >
      {mutation.isPending ? 'Poisoning…' : 'Poison the sink, then verify'}
    </Button>
  )
}
