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

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DevProdCallout } from '@/components/errors/dev-prod-callout'
import { TriggerGrid } from '@/components/errors/trigger-grid'
import { TriggerResponsePanel } from '@/components/errors/trigger-response-panel'
import { TRIGGERS } from '@/components/errors/triggers'
import { useErrorTrigger } from '@/hooks/use-error-trigger'

export default function ErrorsPage() {
  const { response, activeId, handleTrigger } = useErrorTrigger()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader accent>
          <CardTitle as="h1">Errors</CardTitle>
          <CardDescription>
            Trigger every documented `BYMAX_*` derivation and inspect the exact 7-field envelope the
            library returns.
          </CardDescription>
        </CardHeader>
      </Card>

      <DevProdCallout />

      <TriggerGrid triggers={TRIGGERS} activeId={activeId} onTrigger={handleTrigger} />

      <TriggerResponsePanel response={response} />
    </div>
  )
}
