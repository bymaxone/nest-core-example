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

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckList } from '@/components/health/check-list'
import { StatusTiles } from '@/components/health/status-tiles'
import { ToggleCard } from '@/components/health/toggle-card'
import { getLiveness, getReadiness, toggleFlaky, toggleHang } from '@/lib/health-api'

/** Polling interval for both health endpoints, in milliseconds. */
const POLL_INTERVAL_MS = 2000

const FLAKY_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
] as const

const HANG_OPTIONS = [
  { value: 'false', label: 'Disarm' },
  { value: 'true', label: 'Arm' },
] as const

export default function HealthPage() {
  const queryClient = useQueryClient()

  const live = useQuery({
    queryKey: ['health', 'live'],
    queryFn: getLiveness,
    refetchInterval: POLL_INTERVAL_MS,
  })
  const ready = useQuery({
    queryKey: ['health', 'ready'],
    queryFn: getReadiness,
    refetchInterval: POLL_INTERVAL_MS,
  })

  const readyData = ready.data?.ok ? ready.data.data : undefined
  const liveStatus = live.data?.ok ? live.data.data.status : undefined
  const flakyCheck = readyData?.checks.find((check) => check.name === 'flaky')
  // The hanging indicator has no separate "armed" field: once armed, every
  // readiness check sleeps past the timeout and is reported down until
  // disarmed, so its down/up status doubles as the armed/disarmed toggle state.
  const hangCheck = readyData?.checks.find((check) => check.name === 'hanging')

  const handleToggled = () => {
    void queryClient.invalidateQueries({ queryKey: ['health', 'ready'] })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader accent>
          <CardTitle>Health</CardTitle>
          <CardDescription>
            Liveness and readiness, aggregated from the event-loop, flaky, and hanging demo
            indicators. Flip the toggles below and watch readiness react.
          </CardDescription>
        </CardHeader>
      </Card>

      <StatusTiles
        liveStatus={liveStatus}
        readyStatus={readyData?.status}
        loading={live.isPending || ready.isPending}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ToggleCard
          title="Flaky indicator"
          options={FLAKY_OPTIONS}
          activeValue={flakyCheck?.status}
          onToggle={(value) => toggleFlaky(value)}
          onToggled={handleToggled}
        />
        <ToggleCard
          title="Hanging indicator"
          options={HANG_OPTIONS}
          activeValue={hangCheck ? (hangCheck.status === 'down' ? 'true' : 'false') : undefined}
          onToggle={(value) => toggleHang(value === 'true')}
          onToggled={handleToggled}
        />
      </div>

      <Card>
        <CardHeader accent>
          <CardTitle className="text-base">Checks</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <CheckList checks={readyData?.checks ?? []} />
        </div>
      </Card>
    </div>
  )
}
