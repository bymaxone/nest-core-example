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
})
