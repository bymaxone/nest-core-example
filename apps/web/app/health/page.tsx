/**
 * @fileoverview Health Console.
 *
 * Polls liveness and readiness on a bounded interval, renders the aggregate
 * status tiles and the per-indicator check list, and exposes the flaky and
 * hanging demo toggles so readiness flips 200 <-> 503 live in front of the
 * user.
 *
 * @layer screen
 */

'use client'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CARD_TITLE_CONTENT_CLASS,
} from '@/components/ui/card'
import { CheckList } from '@/components/health/check-list'
import { HealthToggles } from '@/components/health/health-toggles'
import { StatusTiles } from '@/components/health/status-tiles'
import { useHealthConsole } from '@/hooks/use-health-console'

export default function HealthPage() {
  const health = useHealthConsole()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle as="h1" className={`text-xl ${CARD_TITLE_CONTENT_CLASS}`}>
            Health
          </CardTitle>
          <CardDescription>
            Liveness and readiness, aggregated from the event-loop, flaky, and hanging demo
            indicators. Flip the toggles below and watch readiness react.
          </CardDescription>
        </CardHeader>
      </Card>

      <StatusTiles
        liveStatus={health.liveStatus}
        readyStatus={health.readyStatus}
        loading={health.loading}
      />

      <HealthToggles
        flakyStatus={health.flakyStatus}
        hangStatus={health.hangStatus}
        onToggled={health.refreshReadiness}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checks</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <CheckList checks={health.checks} />
        </div>
      </Card>
    </div>
  )
}
