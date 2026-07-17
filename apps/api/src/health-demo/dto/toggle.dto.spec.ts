/**
 * Unit tests for the health demo toggle schemas.
 *
 * Layer: unit.
 * Goal: verify the flaky status enum and the hang boolean-from-string transform
 * accept valid input on both branches and reject invalid input.
 * Mocks: none; the schemas are pure Zod parsers.
 */

import { describe, expect, it } from '@jest/globals'

import { flakyToggleSchema, hangToggleSchema } from './toggle.dto.js'

describe('flakyToggleSchema', () => {
  /**
   * Valid statuses.
   *
   * Both `up` and `down` must parse unchanged, since they select the readiness
   * the flaky indicator reports.
   */
  it('accepts up and down', () => {
    expect(flakyToggleSchema.parse({ status: 'up' })).toEqual({ status: 'up' })
    expect(flakyToggleSchema.parse({ status: 'down' })).toEqual({ status: 'down' })
  })

  /**
   * Invalid status.
   *
   * Anything outside the enum must fail rather than clamp, so a mistyped toggle
   * surfaces as a validation error.
   */
  it('rejects an unknown status', () => {
    expect(flakyToggleSchema.safeParse({ status: 'sideways' }).success).toBe(false)
  })
})

describe('hangToggleSchema', () => {
  /**
   * Boolean-from-string both ways.
   *
   * `"true"` must become `true` and `"false"` must become `false`, covering
   * both sides of the transform so `"false"` is never treated as truthy.
   */
  it('maps the enabled string to a boolean', () => {
    expect(hangToggleSchema.parse({ enabled: 'true' })).toEqual({ enabled: true })
    expect(hangToggleSchema.parse({ enabled: 'false' })).toEqual({ enabled: false })
  })

  /**
   * Invalid enabled value.
   *
   * A non-`true`/`false` string must fail validation rather than coerce.
   */
  it('rejects a non-boolean enabled value', () => {
    expect(hangToggleSchema.safeParse({ enabled: 'maybe' }).success).toBe(false)
  })
})
