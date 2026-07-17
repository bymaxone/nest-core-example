/**
 * Unit tests for FlakyStateService.
 *
 * Layer: unit.
 * Goal: verify the shared flaky readiness state starts healthy and records both
 * the new status and a refreshed timestamp on every change.
 * Mocks: none; the service is a plain in-memory holder.
 */

import { describe, expect, it } from '@jest/globals'

import { FlakyStateService } from './flaky-state.service.js'

describe('FlakyStateService', () => {
  /**
   * Default state.
   *
   * A fresh service must report `up` with a parseable ISO timestamp, so a
   * process boots ready and the indicator always has a valid `toggledAt`.
   */
  it('starts up with a valid ISO toggledAt', () => {
    const service = new FlakyStateService()

    expect(service.getStatus()).toBe('up')
    expect(Number.isNaN(Date.parse(service.getToggledAt()))).toBe(false)
  })

  /**
   * Mutation.
   *
   * Setting a new status must store it, return it, and refresh the toggled
   * timestamp, which is the signal the readiness endpoint surfaces as a detail.
   */
  it('stores a new status and refreshes the timestamp', () => {
    const service = new FlakyStateService()

    const returned = service.setStatus('down')

    expect(returned).toBe('down')
    expect(service.getStatus()).toBe('down')
    expect(Number.isNaN(Date.parse(service.getToggledAt()))).toBe(false)
  })
})
