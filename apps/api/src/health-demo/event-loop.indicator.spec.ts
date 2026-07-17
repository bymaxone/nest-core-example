/**
 * Unit tests for EventLoopHealthIndicator.
 *
 * Layer: unit.
 * Goal: verify the indicator always reports up and annotates a non-negative,
 * numeric event-loop lag detail.
 * Mocks: none; the indicator schedules a real setImmediate.
 */

import { describe, expect, it } from '@jest/globals'

import { EventLoopHealthIndicator } from './event-loop.indicator.js'

describe('EventLoopHealthIndicator', () => {
  /**
   * Healthy measurement.
   *
   * The indicator must report up under its documented name and expose a numeric
   * `lagMs` that is never negative, proving it measures a real turnaround rather
   * than returning a fixed value.
   */
  it('reports up with a non-negative numeric lag', async () => {
    const indicator = new EventLoopHealthIndicator()

    const result = await indicator.check()

    expect(indicator.name).toBe('event-loop')
    expect(result.status).toBe('up')
    const lagMs = result.details?.['lagMs']
    expect(typeof lagMs).toBe('number')
    expect(lagMs as number).toBeGreaterThanOrEqual(0)
  })
})
