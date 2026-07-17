/**
 * @fileoverview Renders the last-fired trigger's response: the envelope via
 * the shared viewer, or a transport-failure message.
 *
 * @layer components/errors
 */

import { EnvelopeViewer } from '@/components/shared/envelope-viewer'
import type { TriggerResponseState } from '@/hooks/use-error-trigger'

interface TriggerResponsePanelProps {
  /** The current response state; renders nothing while idle. */
  response: TriggerResponseState
}

/**
 * Response panel: the envelope viewer, a transport-failure message, or
 * nothing before any trigger has been fired.
 *
 * @param response - The current response state.
 */
export function TriggerResponsePanel({ response }: TriggerResponsePanelProps) {
  if (response.kind === 'idle') {
    return null
  }

  return (
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
  )
}
