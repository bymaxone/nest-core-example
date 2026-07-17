/**
 * @fileoverview Artificial-delay endpoint for the Latency Lab. `GET /latency`
 * awaits the requested, clamped delay and reports the actual elapsed time,
 * driving the global timing interceptor's slow-request flag and the
 * sink-poison proof end to end.
 * @layer controller
 */

import { Controller, Get, Inject, Query } from '@nestjs/common'

import { RingBufferTimingSink } from '../core/ring-buffer-timing.sink.js'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { latencyQuerySchema } from './dto/latency-query.dto.js'
import type { LatencyQuery } from './dto/latency-query.dto.js'

/** Response body for the artificial-delay endpoint. */
interface LatencyResponse {
  /** The clamped delay that was requested, in milliseconds. */
  readonly requestedMs: number
  /** The actual wall-clock time the handler took to resolve, in milliseconds. */
  readonly elapsedMs: number
  /** Whether this request armed the one-shot sink poison. */
  readonly poisoned: boolean
}

/**
 * Await a delay of `ms` milliseconds.
 *
 * @param ms - Milliseconds to wait.
 * @returns A promise resolving once the delay has elapsed.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Latency Lab controller: a single artificial-delay endpoint.
 */
@Controller('latency')
export class LatencyController {
  /**
   * @param sink - The demo ring-buffer timing sink. When `poison=true`, its
   *   one-shot poison is armed so that this request's own post-handler sample
   *   recording fails once, proving a broken sink never breaks the response.
   */
  constructor(@Inject(RingBufferTimingSink) private readonly sink: RingBufferTimingSink) {}

  /**
   * Sleep for the requested, clamped duration and report the elapsed time,
   * optionally arming the one-shot sink poison for this request.
   *
   * @param query - The Zod-validated `ms` (clamped) and `poison` flag.
   * @returns The requested delay, the measured elapsed time, and whether the
   *   sink poison was armed.
   */
  @Get()
  async fireDelay(
    @Query(new ZodValidationPipe(latencyQuerySchema)) query: LatencyQuery,
  ): Promise<LatencyResponse> {
    // Arm the one-shot poison before the delay so the timing interceptor's
    // post-handler recording for THIS request hits the poisoned sink.
    if (query.poison) {
      this.sink.armPoison()
    }
    // performance.now() is the monotonic clock, the same kind of source the
    // library's own timing interceptor uses; Date.now() is never appropriate
    // for measuring elapsed time.
    const start = performance.now()
    await delay(query.ms)
    return {
      requestedMs: query.ms,
      elapsedMs: Math.round(performance.now() - start),
      poisoned: query.poison,
    }
  }
}
