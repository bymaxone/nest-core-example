/**
 * @fileoverview Timeout-demonstrating health indicator. When armed it sleeps
 * past the configured per-indicator timeout so the library's aggregator
 * converts the check into a `down` entry by timeout; the indicator itself never
 * reports down or rejects, keeping the timeout the library's responsibility.
 * When disarmed it returns `up` immediately.
 * @layer service
 */

import { Inject, Injectable } from '@nestjs/common'
import { BYMAX_CORE_OPTIONS } from '@bymax-one/nest-core'
import type { ResolvedCoreOptions } from '@bymax-one/nest-core'
import type { HealthIndicatorResult, IHealthIndicator } from '@bymax-one/nest-core/health'

import { HangStateService } from './hang-state.service.js'

/** Delay added past the configured timeout so the aggregator times out first. */
const HANG_OVERSHOOT_MS = 250

/**
 * Await a delay whose timer never keeps the process alive on its own.
 *
 * The timer is unreferenced so an armed check left in flight after the
 * aggregator has already timed out cannot hold the event loop open.
 *
 * @param ms - Milliseconds to wait.
 * @returns A promise resolving once the delay has elapsed.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms).unref()
  })
}

/**
 * Sleeps past the per-indicator timeout when armed; healthy otherwise.
 */
@Injectable()
export class HangingHealthIndicator implements IHealthIndicator {
  /** Name reported in the readiness `checks` array. */
  readonly name = 'hanging'

  /**
   * @param state - Shared arm flag written by the toggle endpoint.
   * @param options - Resolved core options; supplies the per-indicator timeout
   *   the armed sleep must exceed.
   */
  constructor(
    @Inject(HangStateService) private readonly state: HangStateService,
    @Inject(BYMAX_CORE_OPTIONS) private readonly options: ResolvedCoreOptions,
  ) {}

  /**
   * Return `up` instantly when disarmed; when armed, sleep past the configured
   * timeout so the aggregator reports this check `down` by timeout.
   *
   * @returns Always resolves `up`; when armed it resolves only after the
   *   aggregator's timeout has already elapsed, so the caller never sees it.
   */
  async check(): Promise<HealthIndicatorResult> {
    if (!this.state.isArmed()) {
      return { status: 'up' }
    }
    await sleep(this.options.health.indicatorTimeoutMs + HANG_OVERSHOOT_MS)
    return { status: 'up' }
  }
}
