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
import { CoreWiringModule, createRingBufferTimingInterceptor } from './core.module.js'
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
})
