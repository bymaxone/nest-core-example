/**
 * Unit tests for TimingFeedController.
 *
 * Layer: unit.
 * Goal: verify the samples feed reports the resolved threshold and the sink
 * snapshot, and that the poison endpoint arms the sink.
 * Mocks: a RingBufferTimingSink stub and a resolved-options stub via the tokens.
 */

import type { RequestTimingSample, ResolvedCoreOptions } from '@bymax-one/nest-core'
import { describe, expect, it, jest } from '@jest/globals'

import type { RingBufferTimingSink } from '../core/ring-buffer-timing.sink.js'
import { TimingFeedController } from './timing-feed.controller.js'

/** Build the controller with stubbed sink and options. */
function build() {
  const samples: RequestTimingSample[] = [
    { method: 'GET', route: '/timing/samples', statusCode: 200, durationMs: 5, slow: false },
  ]
  const snapshot = jest.fn(() => samples)
  const armPoison = jest.fn()
  const sink = { snapshot, armPoison } as unknown as RingBufferTimingSink
  const options = { timing: { slowRequestThresholdMs: 250 } } as unknown as ResolvedCoreOptions
  return { controller: new TimingFeedController(sink, options), samples, snapshot, armPoison }
}

describe('TimingFeedController', () => {
  /**
   * Samples feed contract.
   *
   * The feed must return the resolved slow threshold and the sink snapshot so
   * the dashboard can render recent requests against the threshold.
   */
  it('returns the threshold and the sink snapshot', () => {
    const { controller, samples, snapshot } = build()

    const result = controller.getSamples()

    expect(result).toEqual({ thresholdMs: 250, samples })
    expect(snapshot).toHaveBeenCalledTimes(1)
  })

  /**
   * Poison arming.
   *
   * The poison endpoint must arm the sink and acknowledge, so the never-throw
   * guarantee can be exercised on the next request.
   */
  it('arms the sink poison and acknowledges', () => {
    const { controller, armPoison } = build()

    const result = controller.armPoison()

    expect(armPoison).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ armed: true })
  })
})
