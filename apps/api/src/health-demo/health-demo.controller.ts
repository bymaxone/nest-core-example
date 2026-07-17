/**
 * @fileoverview Control surface for the Health Console. Two toggle endpoints
 * mutate the shared indicator state so the dashboard can flip readiness live:
 * `POST /health-demo/flaky` drives the flaky indicator up or down and
 * `POST /health-demo/hang` arms or disarms the timeout demonstration. Both echo
 * the resulting state.
 * @layer controller
 */

import { Controller, HttpCode, HttpStatus, Inject, Post, Query } from '@nestjs/common'

import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import type { FlakyToggleQuery, HangToggleQuery } from './dto/toggle.dto.js'
import { flakyToggleSchema, hangToggleSchema } from './dto/toggle.dto.js'
import type { FlakyStatus } from './flaky-state.service.js'
import { FlakyStateService } from './flaky-state.service.js'
import { HangStateService } from './hang-state.service.js'

/** Acknowledgement of a toggle, echoing the indicator's new state. */
interface ToggleResponse {
  /** The indicator whose state was changed. */
  readonly name: string
  /** The state now held: a readiness for `flaky`, an armed flag for `hanging`. */
  readonly state: FlakyStatus | boolean
}

/**
 * Runtime toggles for the flaky and hanging demo indicators.
 */
@Controller('health-demo')
export class HealthDemoController {
  /**
   * @param flaky - Shared flaky readiness state, mutated by the flaky toggle.
   * @param hang - Shared hang arm state, mutated by the hang toggle.
   */
  constructor(
    @Inject(FlakyStateService) private readonly flaky: FlakyStateService,
    @Inject(HangStateService) private readonly hang: HangStateService,
  ) {}

  /**
   * Set the readiness the flaky indicator reports next, flipping readiness
   * between 200 and 503 on the next `GET /health/ready`.
   *
   * @param query - The Zod-validated `status` (`up` or `down`).
   * @returns The flaky indicator name and its new readiness state.
   */
  @Post('flaky')
  @HttpCode(HttpStatus.OK)
  toggleFlaky(
    @Query(new ZodValidationPipe(flakyToggleSchema)) query: FlakyToggleQuery,
  ): ToggleResponse {
    return { name: 'flaky', state: this.flaky.setStatus(query.status) }
  }

  /**
   * Arm or disarm the hanging indicator. When armed, the next readiness check
   * reports it down by timeout with a diagnostic detail.
   *
   * @param query - The Zod-validated `enabled` boolean-from-string.
   * @returns The hanging indicator name and its new armed flag.
   */
  @Post('hang')
  @HttpCode(HttpStatus.OK)
  toggleHang(
    @Query(new ZodValidationPipe(hangToggleSchema)) query: HangToggleQuery,
  ): ToggleResponse {
    return { name: 'hanging', state: this.hang.setArmed(query.enabled) }
  }
}
