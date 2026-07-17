/**
 * Unit tests for LatencyController.
 *
 * Layer: unit.
 * Goal: verify the handler awaits the requested delay before resolving, reports
 * both the requested and measured durations, and arms the one-shot sink poison
 * only when `poison` is true. The interceptor, slow-flag, and end-to-end
 * sink-poison round-trip proofs live in latency-timing.spec.ts against a real,
 * interceptor-wired module.
 * Mocks: a stub sink whose `armPoison` is a jest.fn(); fake timers control the
 * awaited delay deterministically.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

import type { RingBufferTimingSink } from '../core/ring-buffer-timing.sink.js'
import { LatencyController } from './latency.controller.js'

/**
 * Build a controller backed by a stub sink.
 *
 * @returns The controller under test and its `armPoison` spy.
 */
function buildController(): { controller: LatencyController; armPoison: jest.Mock } {
  const armPoison = jest.fn()
  const sink = { armPoison } as unknown as RingBufferTimingSink
  return { controller: new LatencyController(sink), armPoison }
}

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
    const { controller } = buildController()
    let resolved = false

    const pending = controller.fireDelay({ ms: 50, poison: false }).then((result) => {
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
    const { controller } = buildController()

    const pending = controller.fireDelay({ ms: 0, poison: false })
    await jest.advanceTimersByTimeAsync(0)
    const result = await pending

    expect(result.requestedMs).toBe(0)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
  })

  /**
   * Measured elapsed time from the monotonic clock.
   *
   * With the clock pinned to a start and end reading, `elapsedMs` must be the
   * end-minus-start delta (rounded), proving the handler subtracts the start
   * from the end rather than adding them, and that it uses `performance.now`.
   */
  it('reports the elapsed time as the delta between clock readings', async () => {
    jest.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValue(1005)
    const { controller } = buildController()

    const pending = controller.fireDelay({ ms: 5, poison: false })
    await jest.advanceTimersByTimeAsync(5)
    const result = await pending

    expect(result.elapsedMs).toBe(5)
  })

  /**
   * Poison arming.
   *
   * `poison: true` must arm the sink's one-shot poison exactly once and report
   * `poisoned: true`, while the request itself still resolves normally.
   */
  it('arms the one-shot sink poison when poison is true', async () => {
    const { controller, armPoison } = buildController()

    const pending = controller.fireDelay({ ms: 0, poison: true })
    await jest.advanceTimersByTimeAsync(0)
    const result = await pending

    expect(armPoison).toHaveBeenCalledTimes(1)
    expect(result.poisoned).toBe(true)
  })

  /**
   * No poison by default.
   *
   * `poison: false` must leave the sink untouched and report `poisoned: false`.
   */
  it('leaves the sink untouched when poison is false', async () => {
    const { controller, armPoison } = buildController()

    const pending = controller.fireDelay({ ms: 0, poison: false })
    await jest.advanceTimersByTimeAsync(0)
    const result = await pending

    expect(armPoison).not.toHaveBeenCalled()
    expect(result.poisoned).toBe(false)
  })
})
