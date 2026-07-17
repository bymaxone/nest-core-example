/**
 * @fileoverview Toggleable demo health indicator. It reports whatever readiness
 * state the shared {@link FlakyStateService} currently holds, so the toggle
 * endpoint can flip readiness between `up` and `down` at runtime and prove the
 * library's readiness aggregation end to end.
 * @layer service
 */

import { Inject, Injectable } from '@nestjs/common'
import type { HealthIndicatorResult, IHealthIndicator } from '@bymax-one/nest-core/health'

import { FlakyStateService } from './flaky-state.service.js'

/**
 * Reports the readiness state held by {@link FlakyStateService}.
 */
@Injectable()
export class FlakyHealthIndicator implements IHealthIndicator {
  /** Name reported in the readiness `checks` array. */
  readonly name = 'flaky'

  /**
   * @param state - Shared, runtime-mutable readiness state written by the toggle
   *   endpoint and read here on every check.
   */
  constructor(@Inject(FlakyStateService) private readonly state: FlakyStateService) {}

  /**
   * Report the currently held readiness state and when it was last set.
   *
   * The read is synchronous; the contract's `Promise` return is satisfied with
   * an already-resolved value rather than an `async` method with no `await`.
   *
   * @returns The held status, with the last-toggled instant as a detail.
   */
  check(): Promise<HealthIndicatorResult> {
    return Promise.resolve({
      status: this.state.getStatus(),
      details: { toggledAt: this.state.getToggledAt() },
    })
  }
}
