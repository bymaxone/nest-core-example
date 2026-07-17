/**
 * @fileoverview Overview page — the status strip and quick links.
 *
 * Polls `/health/ready` and `/timing/samples` on a bounded interval so the
 * readiness chip and request/slow/error counts feel live without a realtime
 * transport the library does not provide.
 *
 * @layer screen
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, BarChart3, HeartPulse, Layers } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuickLinkCard } from '@/components/overview/quick-link-card'
import { StatTile } from '@/components/shared/stat-tile'
import { StatusChip } from '@/components/shared/status-chip'
import { getReadiness } from '@/lib/health-api'
import { getTimingSamples, summarizeSamples } from '@/lib/timing-api'

/** Polling interval for the status strip's live feel, in milliseconds. */
const POLL_INTERVAL_MS = 3000

/** The five feature pages linked from the Overview's quick-link grid. */
const QUICK_LINKS = [
  {
    href: '/errors',
    title: 'Errors',
    description: 'Trigger every BYMAX_* code and inspect the annotated envelope.',
    icon: AlertTriangle,
  },
  {
    href: '/latency',
    title: 'Latency',
    description: 'Fire delayed requests and watch the slow flag and sink poison.',
    icon: Activity,
  },
  {
    href: '/pagination',
    title: 'Pagination',
    description: 'Walk the catalog by offset and by opaque cursor.',
    icon: Layers,
  },
  {
    href: '/health',
    title: 'Health',
    description: 'Flip readiness live with the flaky and hanging toggles.',
    icon: HeartPulse,
  },
  {
    href: '/metrics',
    title: 'Metrics',
    description: 'Read the raw Prometheus scrape and the parsed highlights.',
    icon: BarChart3,
  },
] as const

export default function OverviewPage() {
  const readiness = useQuery({
    queryKey: ['health', 'ready'],
    queryFn: getReadiness,
    refetchInterval: POLL_INTERVAL_MS,
  })
  const timing = useQuery({
    queryKey: ['timing', 'samples'],
    queryFn: getTimingSamples,
    refetchInterval: POLL_INTERVAL_MS,
  })

  const summary = summarizeSamples(timing.data?.ok ? timing.data.data.samples : [])
  const healthStatus = readiness.data?.ok ? readiness.data.data.status : undefined

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader accent>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            A live snapshot of nest-core-example&apos;s demo API: request volume, slow requests, and
            error responses from the timing feed, plus the current readiness state.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Readiness"
          value={
            healthStatus ? (
              <StatusChip severity={healthStatus} label={healthStatus.toUpperCase()} />
            ) : (
              '—'
            )
          }
          loading={readiness.isPending}
        />
        <StatTile label="Requests" value={summary.total} loading={timing.isPending} />
        <StatTile
          label="Slow requests"
          value={summary.slow}
          severity={summary.slow > 0 ? 'warn' : 'ok'}
          loading={timing.isPending}
        />
        <StatTile
          label="Error responses"
          value={summary.errors}
          severity={summary.errors > 0 ? 'error' : 'ok'}
          loading={timing.isPending}
        />
      </div>

      <div>
        <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Explore
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <QuickLinkCard key={link.href} {...link} />
          ))}
        </div>
      </div>
    </div>
  )
}
