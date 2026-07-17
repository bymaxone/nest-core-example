/**
 * Unit tests for AppController.
 *
 * Layer: unit.
 * Goal: verify the root route returns the static service descriptor.
 * Mocks: none, the controller is stateless.
 */

import { describe, expect, it } from '@jest/globals'

import { AppController } from './app.controller.js'

describe('AppController', () => {
  /**
   * Root descriptor contract.
   *
   * The route must return a stable name and a docs pointer so the boot smoke
   * test and the dashboard have a dependable liveness target.
   */
  it('returns the service name and docs pointer', () => {
    const controller = new AppController()

    expect(controller.getInfo()).toEqual({
      name: 'nest-core-example',
      docs: 'See the repository README for the full endpoint catalogue.',
    })
  })

  /**
   * CI-probe route contract.
   *
   * The shared pipeline's boot-wait step polls this exact route before
   * running the Playwright web smoke, so it must always return the constant
   * ok body regardless of any other service state.
   */
  it('returns a constant ok status from the bare CI-probe route', () => {
    const controller = new AppController()

    expect(controller.getProbeStatus()).toEqual({ status: 'ok' })
  })
})
