/**
 * @fileoverview Exposes the demo timing ring buffer. `GET /timing/samples`
 * returns the recent samples alongside the resolved slow threshold (read from
 * `BYMAX_CORE_OPTIONS`), and `POST /timing/poison` arms the sink's one-shot
 * failure so the interceptor's never-throw guarantee can be observed.
 * @layer controller
 */

import { Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import { BYMAX_CORE_OPTIONS } from '@bymax-one/nest-core'
import type { RequestTimingSample, ResolvedCoreOptions } from '@bymax-one/nest-core'

import { RingBufferTimingSink } from '../core/ring-buffer-timing.sink.js'

/** Response body for the samples feed. */
interface TimingSamplesResponse {
  /** The configured slow-request threshold in ms, or undefined when unset. */
  readonly thresholdMs: number | undefined
  /** Recent request-timing samples, oldest first. */
  readonly samples: readonly RequestTimingSample[]
}

/** Response body acknowledging that the poison was armed. */
interface PoisonResponse {
  /** Always true; the next sink write will throw exactly once. */
  readonly armed: boolean
}

/**
 * Read-and-arm controller for the demo timing sink.
 */
@Controller('timing')
export class TimingFeedController {
  constructor(
    @Inject(RingBufferTimingSink) private readonly sink: RingBufferTimingSink,
    @Inject(BYMAX_CORE_OPTIONS) private readonly options: ResolvedCoreOptions,
  ) {}

  /**
   * List recent timing samples and the resolved slow threshold.
   *
   * @returns The threshold and a snapshot of the retained samples.
   */
  @Get('samples')
  getSamples(): TimingSamplesResponse {
    return {
      thresholdMs: this.options.timing.slowRequestThresholdMs,
      samples: this.sink.snapshot(),
    }
  }

  /**
   * Arm the sink's one-shot poison so the next recorded sample throws once.
   *
   * @returns Acknowledgement that the poison is armed.
   */
  @Post('poison')
  @HttpCode(HttpStatus.ACCEPTED)
  armPoison(): PoisonResponse {
    this.sink.armPoison()
    return { armed: true }
  }
}
