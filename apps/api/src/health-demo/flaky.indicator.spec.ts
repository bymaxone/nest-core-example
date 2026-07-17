/**
 * Unit tests for FlakyHealthIndicator.
 *
 * Layer: unit.
 * Goal: verify the indicator mirrors the shared flaky state on both the up and
 * down paths and always carries the toggled-at diagnostic detail.
 * Mocks: none; a real FlakyStateService supplies the state.
 */

import { describe, expect, it } from '@jest/globals'

import { FlakyHealthIndicator } from './flaky.indicator.js'
import { FlakyStateService } from './flaky-state.service.js'

describe('FlakyHealthIndicator', () => {
  /**
   * Up path.
   *
   * With the default state, the indicator must report up under its name and
   * expose a string `toggledAt`, the detail the Health Console renders per check.
   */
  it('reports up with a toggledAt detail by default', async () => {
    const indicator = new FlakyHealthIndicator(new FlakyStateService())

    const result = await indicator.check()

    expect(indicator.name).toBe('flaky')
    expect(result.status).toBe('up')
    expect(typeof result.details?.['toggledAt']).toBe('string')
  })

  /**
   * Down path.
   *
   * After the shared state is toggled down, the next check must report down,
   * which is what flips readiness to 503 in front of the user.
   */
  it('reports down after the state is toggled down', async () => {
    const state = new FlakyStateService()
    state.setStatus('down')
    const indicator = new FlakyHealthIndicator(state)

    const result = await indicator.check()

    expect(result.status).toBe('down')
  })
})
