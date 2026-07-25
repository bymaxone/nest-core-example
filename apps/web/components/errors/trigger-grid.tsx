/**
 * @fileoverview Grid of glass cards, one per `BYMAX_*` derivation, grouped
 * into 4xx / 5xx / special. The one custom-code card (`seasonal`) is
 * visually distinguished with the secondary badge and border color instead
 * of the standard outline treatment.
 *
 * @layer components/errors
 */

'use client'

import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Trigger, TriggerGroup } from './triggers'

/**
 * Render an error code with a break opportunity after every underscore.
 *
 * Codes such as `BYMAX_UNSUPPORTED_MEDIA_TYPE` are wider than a grid cell and
 * carry no spaces, so the browser would either overflow the card or break the
 * token mid-word. `<wbr>` marks the underscores as the only legal break points
 * and contributes nothing to the element's text, so the code stays exact for
 * reading and copying.
 *
 * @param code - The error code to render.
 * @returns The code's segments interleaved with break opportunities.
 */
function BreakableCode({ code }: { code: string }) {
  const segments = code.split('_')
  return (
    <>
      {segments.map((segment, index) => (
        <React.Fragment key={`${segment}-${String(index)}`}>
          {index < segments.length - 1 ? `${segment}_` : segment}
          {index < segments.length - 1 && <wbr />}
        </React.Fragment>
      ))}
    </>
  )
}

/** Section heading per visual group, in display order. */
const GROUPS: readonly { readonly id: TriggerGroup; readonly label: string }[] = [
  { id: '4xx', label: 'Client errors (4xx)' },
  { id: '5xx', label: 'Server errors (5xx)' },
  { id: 'special', label: 'Special cases' },
]

interface TriggerGridProps {
  /** Every trigger card to render. */
  triggers: readonly Trigger[]
  /** The id of the trigger currently in flight, or null when idle. */
  activeId: string | null
  /** Called with a trigger's id when its card is clicked. */
  onTrigger: (id: string) => void
}

/**
 * Grouped grid of trigger cards.
 *
 * @param triggers - Every trigger card to render.
 * @param activeId - The id of the in-flight trigger, disabling every card.
 * @param onTrigger - Called with a trigger's id on click.
 */
export function TriggerGrid({ triggers, activeId, onTrigger }: TriggerGridProps) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => {
        const groupTriggers = triggers.filter((trigger) => trigger.group === group.id)
        if (groupTriggers.length === 0) {
          return null
        }
        return (
          <div key={group.id}>
            <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {groupTriggers.map((trigger) => (
                <button
                  key={trigger.id}
                  type="button"
                  disabled={activeId !== null}
                  onClick={() => onTrigger(trigger.id)}
                  className={cn(
                    'border-(--glass-border) bg-(--glass-card-bg) hover:bg-(--glass-bg-hover) flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    trigger.isDomainCode && 'border-(--color-secondary)',
                  )}
                >
                  <span className="font-mono text-sm font-semibold">{trigger.label}</span>
                  <Badge
                    variant={trigger.isDomainCode ? 'secondary' : 'outline'}
                    // inline-block (not the badge's default inline-flex) so the
                    // code's segments lay out as wrapping inline text; capped at
                    // the card width and broken at the underscores.
                    className="inline-block max-w-full whitespace-normal rounded-md py-1 text-center font-mono text-[10px] leading-tight"
                  >
                    <BreakableCode code={trigger.expectedCode} />
                  </Badge>
                  {/* mt-auto pins the status code to the card floor so every
                      card in a row aligns regardless of how many lines the
                      label and the code badge each took. */}
                  <span className="mt-auto text-xs text-muted-foreground">
                    {trigger.statusCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
