/**
 * Unit tests for RingBufferTimingSink.
 *
 * Layer: unit.
 * Goal: verify bounded capacity with oldest-first eviction, snapshot
 * immutability, and the one-shot poison used to prove the never-throw contract.
 * Mocks: a ConfigService stub supplying the buffer capacity.
 */

import type { ConfigService } from '@nestjs/config'
import type { RequestTimingSample } from '@bymax-one/nest-core'
import { describe, expect, it } from '@jest/globals'

import type { Env } from '../config/env.schema.js'
import { RingBufferTimingSink } from './ring-buffer-timing.sink.js'

/** Build a timing sample tagged with a route for identity assertions. */
function sample(route: string): RequestTimingSample {
  return { method: 'GET', route, statusCode: 200, durationMs: 1, slow: false }
}

/**
 * Build a sink whose capacity is fixed to the given size.
 *
 * The stub answers only the `TIMING_BUFFER_SIZE` key so the sink must read from
 * exactly that variable; any other key yields `undefined`, which would disable
 * eviction and fail the bounded-capacity test.
 */
function sinkWithCapacity(capacity: number): RingBufferTimingSink {
  const config = {
    get: (key: string) => (key === 'TIMING_BUFFER_SIZE' ? capacity : undefined),
  } as unknown as ConfigService<Env, true>
  return new RingBufferTimingSink(config)
}

describe('RingBufferTimingSink', () => {
  /**
   * Append then read back.
   *
   * A recorded sample must be visible in the snapshot so the timing feed can
   * display recent requests.
   */
  it('records samples in arrival order', () => {
    const sink = sinkWithCapacity(10)

    sink.record(sample('/a'))
    sink.record(sample('/b'))

    expect(sink.snapshot().map((s) => s.route)).toEqual(['/a', '/b'])
  })

  /**
   * Capacity eviction, boundary case.
   *
   * Beyond capacity the oldest sample is dropped, keeping memory bounded no
   * matter how much traffic flows through the demo.
   */
  it('evicts the oldest sample beyond capacity', () => {
    const sink = sinkWithCapacity(2)

    sink.record(sample('/a'))
    sink.record(sample('/b'))
    sink.record(sample('/c'))

    expect(sink.snapshot().map((s) => s.route)).toEqual(['/b', '/c'])
  })

  /**
   * Snapshot immutability.
   *
   * The snapshot must be a copy so a caller mutating it cannot corrupt the
   * sink's internal buffer.
   */
  it('returns a defensive copy from snapshot', () => {
    const sink = sinkWithCapacity(10)
    sink.record(sample('/a'))

    const first = sink.snapshot() as RequestTimingSample[]
    first.push(sample('/injected'))

    expect(sink.snapshot().map((s) => s.route)).toEqual(['/a'])
  })

  /**
   * One-shot poison, proving the never-throw contract.
   *
   * After arming, the next record throws exactly once; the following record
   * succeeds, demonstrating the failure is transient and interceptor-swallowed.
   */
  it('throws exactly once after the poison is armed', () => {
    const sink = sinkWithCapacity(10)
    sink.armPoison()

    expect(() => sink.record(sample('/boom'))).toThrow(/simulated sink failure/)
    // The poisoned sample was not recorded, and the sink recovers immediately.
    expect(() => sink.record(sample('/ok'))).not.toThrow()
    expect(sink.snapshot().map((s) => s.route)).toEqual(['/ok'])
  })
})
