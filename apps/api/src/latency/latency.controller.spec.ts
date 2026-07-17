/**
 * Unit tests for LatencyController.
 *
 * Layer: unit.
 * Goal: verify the handler awaits the requested delay before resolving and
 * reports both the requested and measured durations. The interceptor,
 * slow-flag, and sink-poison proofs live in latency-timing.spec.ts against a
 * real, interceptor-wired module.
 * Mocks: none; fake timers control the awaited delay deterministically.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

import { LatencyController } from './latency.controller.js'

describe('LatencyController', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  /**
   * Awaited delay before resolution.
   *
   * The handler must not resolve until the requested delay has elapsed,
   * proving the wait is a real await rather than a no-op, and must echo the
   * requested value alongside a non-negative measured duration.
   */
  it('awaits the requested delay before resolving', async () => {
    const controller = new LatencyController()
    let resolved = false

    const pending = controller.fireDelay({ ms: 50 }).then((result) => {
      resolved = true
      return result
    })

    await Promise.resolve()
    expect(resolved).toBe(false)

    await jest.advanceTimersByTimeAsync(50)
    const result = await pending

    expect(resolved).toBe(true)
    expect(result.requestedMs).toBe(50)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
  })

  /**
   * Zero delay, immediate resolution.
   *
   * A requested delay of zero must still resolve cleanly, exercising the
   * fast path used by the "below threshold" Latency Lab demonstration.
   */
  it('resolves immediately for a zero delay', async () => {
    const controller = new LatencyController()

    const pending = controller.fireDelay({ ms: 0 })
    await jest.advanceTimersByTimeAsync(0)
    const result = await pending

    expect(result.requestedMs).toBe(0)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
  })
})
