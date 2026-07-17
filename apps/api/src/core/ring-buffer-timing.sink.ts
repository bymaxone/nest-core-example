/**
 * @fileoverview The example's demo `ITimingSink`: a bounded, in-memory ring
 * buffer of recent request-timing samples exposed by the timing-feed endpoint.
 * Capacity comes from `TIMING_BUFFER_SIZE`; the oldest sample is evicted once
 * the buffer is full.
 * @layer service
 *
 * The library guarantees a sink that throws never breaks the request it is
 * observing: the timing interceptor swallows any `record` failure. This sink
 * exposes a one-shot poison mode ({@link armPoison}) purely to prove that
 * guarantee end to end, by making the next `record` throw exactly once.
 */

import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { ITimingSink, RequestTimingSample } from '@bymax-one/nest-core'

import type { Env } from '../config/env.schema.js'

/**
 * Bounded, poisonable ring-buffer timing sink.
 */
@Injectable()
export class RingBufferTimingSink implements ITimingSink {
  /** Maximum retained samples; the oldest is evicted beyond this. */
  private readonly capacity: number
  /** Retained samples, oldest first. */
  private readonly samples: RequestTimingSample[] = []
  /** When set, the next `record` throws once and clears this flag. */
  private isPoisoned = false

  constructor(@Inject(ConfigService) config: ConfigService<Env, true>) {
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: the `infer` hint is a compile-time type marker with no runtime effect, so an emptied object or a flipped flag reads the same value.
    this.capacity = config.get('TIMING_BUFFER_SIZE', { infer: true })
  }

  /**
   * Record one sample, evicting the oldest when at capacity.
   *
   * When armed by {@link armPoison}, this throws exactly once (and clears the
   * armed state) so the interceptor's never-throw guarantee can be observed.
   *
   * @param sample - The completed-request timing sample.
   * @throws Error once after {@link armPoison}, to simulate a failing sink.
   */
  record(sample: RequestTimingSample): void {
    if (this.isPoisoned) {
      this.isPoisoned = false
      throw new Error('RingBufferTimingSink poison: simulated sink failure')
    }
    this.samples.push(sample)
    if (this.samples.length > this.capacity) {
      this.samples.shift()
    }
  }

  /**
   * Return a defensive copy of the retained samples, oldest first.
   *
   * @returns A snapshot array that callers may mutate without affecting the sink.
   */
  snapshot(): readonly RequestTimingSample[] {
    return [...this.samples]
  }

  /**
   * Arm the one-shot poison so the next {@link record} throws exactly once.
   */
  armPoison(): void {
    this.isPoisoned = true
  }
}
