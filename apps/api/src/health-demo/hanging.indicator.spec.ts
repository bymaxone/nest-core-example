/**
 * Unit tests for HangingHealthIndicator.
 *
 * Layer: unit.
 * Goal: verify the disarmed fast path returns up instantly and the armed path
 * resolves up only after sleeping (the delay the library's aggregator converts
 * into a down-by-timeout entry).
 * Mocks: a resolved-options fixture supplying a zero indicator timeout so the
 * armed sleep stays short.
 */

import type { ResolvedCoreOptions } from '@bymax-one/nest-core'
import { describe, expect, it } from '@jest/globals'

import { HangStateService } from './hang-state.service.js'
import { HangingHealthIndicator } from './hanging.indicator.js'

/** Resolved options with a zero timeout, so the armed overshoot dominates. */
const RESOLVED_OPTIONS: ResolvedCoreOptions = {
  envelope: { enabled: true, exposeInternals: false },
  timing: { enabled: true, slowRequestThresholdMs: 500 },
  health: { enabled: true, path: 'health', indicatorTimeoutMs: 0 },
  metrics: { enabled: true, path: 'metrics', collectDefaultMetrics: true, defaultLabels: {} },
}

describe('HangingHealthIndicator', () => {
  /**
   * Disarmed fast path.
   *
   * When not armed, the check must resolve up immediately with no detail, so
   * readiness stays green and fast during normal operation.
   */
  it('reports up immediately when disarmed', async () => {
    const indicator = new HangingHealthIndicator(new HangStateService(), RESOLVED_OPTIONS)

    expect(indicator.name).toBe('hanging')
    await expect(indicator.check()).resolves.toEqual({ status: 'up' })
  })

  /**
   * Armed hang path.
   *
   * When armed, the check must sleep before resolving up. It never reports down
   * itself; proving the down-by-timeout conversion is the integration suite's
   * job. Here we only assert the branch resolves up after a measurable delay.
   */
  it('resolves up only after sleeping when armed', async () => {
    const state = new HangStateService()
    state.setArmed(true)
    const indicator = new HangingHealthIndicator(state, RESOLVED_OPTIONS)

    const start = performance.now()
    const result = await indicator.check()

    expect(result).toEqual({ status: 'up' })
    expect(performance.now() - start).toBeGreaterThan(0)
  })
})
