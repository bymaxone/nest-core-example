/**
 * @fileoverview Latency Lab.
 *
 * A delay control fires artificial-delay requests; the sample feed and
 * sparkline poll the timing feed to show the results, the slow flag
 * crossing the threshold, and the sink-poison never-throw proof.
 *
 * @layer screen
 */

'use client'

import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DelayControl, TIMING_SAMPLES_QUERY_KEY } from '@/components/latency/delay-control'
import { DurationSparkline } from '@/components/latency/duration-sparkline'
import { PoisonToggle } from '@/components/latency/poison-toggle'
import { SampleFeed } from '@/components/latency/sample-feed'
import { getTimingSamples } from '@/lib/timing-api'

/** Polling interval for the sample feed's live feel, in milliseconds. */
const POLL_INTERVAL_MS = 2000

export default function LatencyPage() {
  const query = useQuery({
    queryKey: TIMING_SAMPLES_QUERY_KEY,
    queryFn: getTimingSamples,
    refetchInterval: POLL_INTERVAL_MS,
  })

  const data = query.data?.ok ? query.data.data : undefined
  const samples = data?.samples ?? []

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader accent>
          <CardTitle>Latency</CardTitle>
          <CardDescription>
            Fire delayed requests and watch the timing interceptor record the route template,
            duration, and slow flag on every completed request.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <DelayControl />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Duration (last 50)
            </h3>
            <DurationSparkline samples={samples} />
            <PoisonToggle />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <SampleFeed samples={samples} thresholdMs={data?.thresholdMs} />
        </CardContent>
      </Card>
    </div>
  )
}
