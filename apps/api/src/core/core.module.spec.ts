/**
 * Unit tests for CoreWiringModule factories.
 *
 * Layer: unit.
 * Goal: verify the ring-buffer timing interceptor factory builds the library's
 * TimingInterceptor bound to the demo sink.
 * Mocks: a ConfigService stub for the sink capacity.
 */

import type { ConfigService } from '@nestjs/config'
import type { ResolvedCoreOptions } from '@bymax-one/nest-core'
import { TimingInterceptor } from '@bymax-one/nest-core'
import { describe, expect, it } from '@jest/globals'

import type { Env } from '../config/env.schema.js'
import { EventLoopHealthIndicator } from '../health-demo/event-loop.indicator.js'
import { FlakyHealthIndicator } from '../health-demo/flaky.indicator.js'
import { FlakyStateService } from '../health-demo/flaky-state.service.js'
import { HangStateService } from '../health-demo/hang-state.service.js'
import { HangingHealthIndicator } from '../health-demo/hanging.indicator.js'
import {
  CoreWiringModule,
  collectHealthIndicators,
  createRingBufferTimingInterceptor,
} from './core.module.js'
import { RingBufferTimingSink } from './ring-buffer-timing.sink.js'

/** A fully resolved options snapshot for the interceptor. */
const RESOLVED_OPTIONS: ResolvedCoreOptions = {
  envelope: { enabled: true, exposeInternals: false },
  timing: { enabled: true, slowRequestThresholdMs: 500 },
  health: { enabled: true, path: 'health', indicatorTimeoutMs: 2000 },
  metrics: { enabled: true, path: 'metrics', collectDefaultMetrics: true, defaultLabels: {} },
}

describe('CoreWiringModule', () => {
  /**
   * Module presence.
   *
   * The module must be importable so its global token bindings are registered.
   */
  it('is defined', () => {
    expect(CoreWiringModule).toBeDefined()
  })

  /**
   * Interceptor factory.
   *
   * The factory must return the library's TimingInterceptor so the demo ring
   * buffer is fed by the library's own measurement logic, not a reimplementation.
   */
  it('builds a TimingInterceptor bound to the ring buffer', () => {
    const config = { get: () => 10 } as unknown as ConfigService<Env, true>
    const sink = new RingBufferTimingSink(config)

    const interceptor = createRingBufferTimingInterceptor(RESOLVED_OPTIONS, sink)

    expect(interceptor).toBeInstanceOf(TimingInterceptor)
  })

  /**
   * Health indicator collection.
   *
   * The factory must return the three demo indicators in a single ordered
   * array, since the library's `BYMAX_HEALTH_INDICATORS` token holds one
   * `IHealthIndicator[]` value rather than a multi-provider aggregation.
   */
  it('collects the three demo indicators into one ordered array', () => {
    const eventLoop = new EventLoopHealthIndicator()
    const flaky = new FlakyHealthIndicator(new FlakyStateService())
    const hanging = new HangingHealthIndicator(new HangStateService(), RESOLVED_OPTIONS)

    const indicators = collectHealthIndicators(eventLoop, flaky, hanging)

    expect(indicators).toEqual([eventLoop, flaky, hanging])
    expect(indicators.map((indicator) => indicator.name)).toEqual([
      'event-loop',
      'flaky',
      'hanging',
    ])
  })
})
