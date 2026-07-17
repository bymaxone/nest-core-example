/**
 * @fileoverview Pure rendering of the timing-samples table: method, route,
 * status, duration, and a slow badge, with the configured threshold shown
 * in the header. Data fetching (polling) lives in the page; this component
 * only renders the props it is given.
 *
 * @layer components/latency
 */

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { severityForHttpStatus } from '@/lib/severity'
import type { RequestTimingSample } from '@/lib/timing-api'

interface SampleRowProps {
  /** The sample this row renders. */
  sample: RequestTimingSample
}

/** One timing-sample row: method, route, status badge, duration, slow badge. */
function SampleRow({ sample }: SampleRowProps) {
  return (
    <TableRow>
      <TableCell className="font-mono">{sample.method}</TableCell>
      <TableCell className="font-mono">{sample.route}</TableCell>
      <TableCell>
        <Badge
          variant={severityForHttpStatus(sample.statusCode) === 'ok' ? 'outline' : 'destructive'}
        >
          {sample.statusCode}
        </Badge>
      </TableCell>
      <TableCell className="font-mono">{sample.durationMs}ms</TableCell>
      <TableCell>{sample.slow && <Badge variant="secondary">slow</Badge>}</TableCell>
    </TableRow>
  )
}

interface SampleFeedProps {
  /** The recent timing samples, oldest first (as returned by the API). */
  samples: readonly RequestTimingSample[]
  /** The configured slow-request threshold in ms, or undefined when unset. */
  thresholdMs: number | undefined
}

/**
 * Table of recent request-timing samples, most recent first.
 *
 * @param samples - The recent timing samples, oldest first.
 * @param thresholdMs - The configured slow-request threshold, shown in the header.
 */
export function SampleFeed({ samples, thresholdMs }: SampleFeedProps) {
  const mostRecentFirst = [...samples].reverse()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Recent requests
        </h3>
        {thresholdMs !== undefined && (
          <span className="font-mono text-xs text-muted-foreground">
            slow threshold: {thresholdMs}ms
          </span>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Method</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Slow</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mostRecentFirst.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No samples yet. Fire a request above.
              </TableCell>
            </TableRow>
          ) : (
            mostRecentFirst.map((sample, index) => (
              <SampleRow
                key={`${sample.method}-${sample.route}-${sample.durationMs}-${index}`}
                sample={sample}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
