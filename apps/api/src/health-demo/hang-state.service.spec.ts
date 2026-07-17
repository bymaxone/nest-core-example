/**
 * Unit tests for HangStateService.
 *
 * Layer: unit.
 * Goal: verify the shared hang arm flag starts disarmed and toggles both ways,
 * returning the stored flag each time.
 * Mocks: none; the service is a plain in-memory holder.
 */

import { describe, expect, it } from '@jest/globals'

import { HangStateService } from './hang-state.service.js'

describe('HangStateService', () => {
  /**
   * Default state.
   *
   * A fresh service must be disarmed so readiness is never accidentally hung
   * at boot.
   */
  it('starts disarmed', () => {
    expect(new HangStateService().isArmed()).toBe(false)
  })

  /**
   * Toggling both directions.
   *
   * Arming and disarming must persist and echo the stored flag so the toggle
   * endpoint can report the new state to the caller.
   */
  it('arms and disarms, returning the stored flag', () => {
    const service = new HangStateService()

    expect(service.setArmed(true)).toBe(true)
    expect(service.isArmed()).toBe(true)
    expect(service.setArmed(false)).toBe(false)
    expect(service.isArmed()).toBe(false)
  })
})
