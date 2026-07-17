/**
 * @fileoverview Zod schema and inferred type for the Latency Lab endpoint. The
 * requested delay is silently clamped into the safe range rather than
 * rejected, mirroring the clamp semantics the library's own pagination
 * helpers use elsewhere in this reference app.
 * @layer dto
 */

import { z } from 'zod'

/** Lowest accepted artificial delay, in milliseconds. */
const MIN_LATENCY_MS = 0

/** Highest accepted artificial delay, in milliseconds; larger values clamp down to this. */
const MAX_LATENCY_MS = 5000

/** Applied when `ms` is absent from the query string. */
const DEFAULT_LATENCY_MS = 0

/**
 * Validated shape accepted by `GET /latency`. `ms` coerces from the raw query
 * string, then clamps into `[0, 5000]` instead of rejecting an out-of-range
 * value.
 */
export const latencyQuerySchema = z.object({
  ms: z.coerce
    .number()
    .int()
    .default(DEFAULT_LATENCY_MS)
    .transform((value) => Math.min(Math.max(value, MIN_LATENCY_MS), MAX_LATENCY_MS)),
})

/** Inferred input type for {@link latencyQuerySchema}. */
export type LatencyQuery = z.infer<typeof latencyQuerySchema>
