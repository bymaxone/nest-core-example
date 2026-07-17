/**
 * @fileoverview Always-up demo health indicator that measures event-loop lag.
 * It schedules a single `setImmediate` and reports the observed turnaround as a
 * diagnostic detail, demonstrating an indicator that performs a real,
 * side-effect-free measurement rather than a fixed toggle.
 * @layer service
 */

import { Injectable } from '@nestjs/common'
import type { HealthIndicatorResult, IHealthIndicator } from '@bymax-one/nest-core/health'

/** Fixed-point scale used to round a fractional millisecond to microseconds. */
const MICROSECOND_SCALE = 1000

/**
 * Round a fractional millisecond measurement to microsecond precision.
 *
 * @param value - The raw millisecond delta.
 * @returns The delta rounded to three decimal places.
 */
function roundMs(value: number): number {
  return Math.round(value * MICROSECOND_SCALE) / MICROSECOND_SCALE
}

/**
 * Reports the process event loop as healthy, annotated with a measured lag.
 */
@Injectable()
export class EventLoopHealthIndicator implements IHealthIndicator {
  /** Name reported in the readiness `checks` array. */
  readonly name = 'event-loop'

  /**
   * Measure a single `setImmediate` turnaround as an event-loop lag proxy.
   *
   * @returns Always `up`, carrying the observed lag in milliseconds as a detail.
   */
  async check(): Promise<HealthIndicatorResult> {
    const start = performance.now()
    await new Promise<void>((resolve) => {
      setImmediate(resolve)
    })
    return { status: 'up', details: { lagMs: roundMs(performance.now() - start) } }
  }
}
