/**
 * @fileoverview Owns the Errors page's trigger state: which trigger is
 * currently firing, and the last response (idle, envelope, or transport
 * failure). Extracted from the page so it stays pure composition.
 *
 * @layer hooks
 */

import { useState } from 'react'

import { TRIGGERS, type Trigger } from '@/components/errors/triggers'
import type { ErrorEnvelope } from '@/lib/envelope'

/** What the response panel currently shows: nothing yet, an envelope, or a transport failure. */
export type TriggerResponseState =
  | { kind: 'idle' }
  | { kind: 'envelope'; trigger: Trigger; envelope: ErrorEnvelope }
  | { kind: 'transport'; trigger: Trigger; message: string }

/** The reactive state and action the Errors page renders. */
export interface ErrorTrigger {
  /** The last trigger's response, or idle before any card has been clicked. */
  readonly response: TriggerResponseState
  /** The id of the trigger currently in flight, or null when idle. */
  readonly activeId: string | null
  /** Fires the trigger registered under `id` and records its response. */
  readonly handleTrigger: (id: string) => void
}

/**
 * Trigger-firing state machine for the Errors page's trigger grid.
 *
 * @returns The current response/active-id state and the fire action.
 */
export function useErrorTrigger(): ErrorTrigger {
  const [response, setResponse] = useState<TriggerResponseState>({ kind: 'idle' })
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleTrigger = async (id: string) => {
    const trigger = TRIGGERS.find((candidate) => candidate.id === id)
    if (!trigger) {
      return
    }
    setActiveId(id)
    try {
      const result = await trigger.run()
      if (result.ok) {
        setResponse({
          kind: 'transport',
          trigger,
          message: 'Unexpected success (this endpoint always fails).',
        })
      } else if (result.kind === 'envelope') {
        setResponse({ kind: 'envelope', trigger, envelope: result.error })
      } else {
        setResponse({ kind: 'transport', trigger, message: result.message })
      }
    } finally {
      setActiveId(null)
    }
  }

  return { response, activeId, handleTrigger: (id) => void handleTrigger(id) }
}
