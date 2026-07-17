/**
 * Unit tests for EventLoopHealthIndicator.
 *
 * Layer: unit.
 * Goal: verify the indicator always reports up and annotates a non-negative,
 * numeric event-loop lag detail.
 * Mocks: none; the indicator schedules a real setImmediate.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { EventLoopHealthIndicator } from './event-loop.indicator.js'

describe('EventLoopHealthIndicator', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  /**
   * Exact lag derivation.
   *
   * With the monotonic clock pinned to a start and end reading, the reported
   * `lagMs` must be the end-minus-start delta rounded to microseconds. A
   * non-zero start proves the delta is subtracted (not added) and the fixed
   * scale proves the microsecond rounding is a true divide.
   */
  it('reports the exact rounded delta between the two clock readings', async () => {
    jest.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1002.5)
    const indicator = new EventLoopHealthIndicator()

    const result = await indicator.check()

    expect(result.details?.['lagMs']).toBe(2.5)
  })
})
