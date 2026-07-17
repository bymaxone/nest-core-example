/**
 * @fileoverview Error Envelope Playground.
 *
 * A trigger grid firing every `BYMAX_*` derivation plus the catalog-driven
 * not-found, validation, and custom-domain-code demos, rendering the exact
 * response envelope in the shared `EnvelopeViewer`.
 *
 * @layer screen
 */

'use client'

import { useState } from 'react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnvelopeViewer } from '@/components/shared/envelope-viewer'
import { TriggerGrid } from '@/components/errors/trigger-grid'
import { TRIGGERS, type Trigger } from '@/components/errors/triggers'
import type { ErrorEnvelope } from '@/lib/envelope'

/** What the response panel currently shows: nothing yet, an envelope, or a transport failure. */
type ResponseState =
  | { kind: 'idle' }
  | { kind: 'envelope'; trigger: Trigger; envelope: ErrorEnvelope }
  | { kind: 'transport'; trigger: Trigger; message: string }

export default function ErrorsPage() {
  const [response, setResponse] = useState<ResponseState>({ kind: 'idle' })
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader accent>
          <CardTitle>Errors</CardTitle>
          <CardDescription>
            Trigger every documented `BYMAX_*` derivation and inspect the exact 7-field envelope the
            library returns.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-4 text-sm text-(--text-70)">
        <strong className="text-foreground">Dev vs. prod:</strong> this example's development
        default is <code className="font-mono text-xs">ENVELOPE_EXPOSE_INTERNALS=true</code>, so the{' '}
        <em>Unknown Throw</em> card's envelope carries a <code>details</code> block with the
        original message and stack. Setting <code>NODE_ENV=production</code> collapses that same
        trigger to the fixed, safe message with no <code>details</code> at all: internals never leak
        to a production client regardless of the flag.
      </div>

      <TriggerGrid
        triggers={TRIGGERS}
        activeId={activeId}
        onTrigger={(id) => void handleTrigger(id)}
      />

      {response.kind !== 'idle' && (
        <div>
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Response: {response.trigger.label}
          </h2>
          {response.kind === 'envelope' ? (
            <EnvelopeViewer envelope={response.envelope} />
          ) : (
            <div className="border-(--glass-border) bg-(--glass-bg) rounded-xl border p-4 font-mono text-sm text-(--color-danger)">
              {response.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
