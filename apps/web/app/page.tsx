/**
 * @fileoverview Overview page: the status strip and quick links.
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
import { QuickLinksGrid, type QuickLink } from '@/components/overview/quick-links-grid'
import { StatusStrip } from '@/components/overview/status-strip'
import { getReadiness } from '@/lib/health-api'
import { getTimingSamples, summarizeSamples } from '@/lib/timing-api'

/** Polling interval for the status strip's live feel, in milliseconds. */
const POLL_INTERVAL_MS = 3000

/** The five feature pages linked from the Overview's quick-link grid. */
const QUICK_LINKS: readonly QuickLink[] = [
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
]

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

      <StatusStrip
        healthStatus={healthStatus}
        summary={summary}
        readinessLoading={readiness.isPending}
        timingLoading={timing.isPending}
      />

      <QuickLinksGrid links={QUICK_LINKS} />
    </div>
  )
}
