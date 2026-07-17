/**
 * Unit tests for latencyQuerySchema.
 *
 * Layer: unit.
 * Goal: verify the schema defaults, coerces, and clamps `ms` into [0, 5000]
 * rather than rejecting an out-of-range value, mirroring the pagination
 * helpers' clamp semantics used throughout this reference app.
 * Mocks: none, pure schema parsing.
 */

import { describe, expect, it } from '@jest/globals'

import { latencyQuerySchema } from './latency-query.dto.js'

describe('latencyQuerySchema', () => {
  /**
   * Default when absent.
   *
   * Omitting `ms` entirely must default to zero rather than fail validation.
   */
  it('defaults ms to zero when absent', () => {
    const result = latencyQuerySchema.safeParse({})

    expect(result.success).toBe(true)
    expect(result.success && result.data.ms).toBe(0)
  })

  /**
   * Coercion from a query string.
   *
   * Query parameters always arrive as strings; a well-formed numeric string
   * must parse to its numeric value.
   */
  it('coerces a numeric query string', () => {
    const result = latencyQuerySchema.safeParse({ ms: '250' })

    expect(result.success).toBe(true)
    expect(result.success && result.data.ms).toBe(250)
  })

  /**
   * Clamp above the maximum.
   *
   * A value above 5000 must clamp down rather than reject, matching the
   * "clamped" behavior documented for this endpoint.
   */
  it('clamps a value above the maximum down to 5000', () => {
    const result = latencyQuerySchema.safeParse({ ms: '999999' })

    expect(result.success).toBe(true)
    expect(result.success && result.data.ms).toBe(5000)
  })

  /**
   * Clamp below the minimum.
   *
   * A negative value must clamp up to zero rather than reject.
   */
  it('clamps a negative value up to zero', () => {
    const result = latencyQuerySchema.safeParse({ ms: '-50' })

    expect(result.success).toBe(true)
    expect(result.success && result.data.ms).toBe(0)
  })

  /**
   * Non-numeric rejection.
   *
   * A value that cannot be coerced to a number must still fail validation:
   * clamping only applies to well-formed, out-of-range numbers.
   */
  it('rejects a non-numeric ms', () => {
    const result = latencyQuerySchema.safeParse({ ms: 'not-a-number' })

    expect(result.success).toBe(false)
  })

  /**
   * Fractional rejection.
   *
   * The delay is a whole millisecond count; a fractional value must fail
   * validation rather than silently truncate.
   */
  it('rejects a fractional ms', () => {
    const result = latencyQuerySchema.safeParse({ ms: '12.5' })

    expect(result.success).toBe(false)
  })
})
