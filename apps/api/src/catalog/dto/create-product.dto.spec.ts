/**
 * Unit tests for createProductSchema.
 *
 * Layer: unit.
 * Goal: verify the Zod schema accepts a well-formed create payload and
 * rejects each invalid field, since these rejections are what
 * ZodValidationPipe turns into the BYMAX_VALIDATION_FAILED envelope.
 * Mocks: none, pure schema parsing.
 */

import { describe, expect, it } from '@jest/globals'

import { createProductSchema } from './create-product.dto.js'

describe('createProductSchema', () => {
  /**
   * Well-formed payload.
   *
   * A valid name, category, and non-negative integer price must parse
   * successfully and echo the input back unchanged.
   */
  it('accepts a well-formed payload', () => {
    const input = { name: 'Test Item', category: 'office', priceCents: 500 }

    const result = createProductSchema.safeParse(input)

    expect(result.success).toBe(true)
    expect(result.success && result.data).toEqual(input)
  })

  /**
   * Empty name, rejected.
   *
   * A blank name must fail validation rather than silently persisting an
   * unnamed product.
   */
  it('rejects an empty name', () => {
    const result = createProductSchema.safeParse({ name: '', category: 'office', priceCents: 500 })

    expect(result.success).toBe(false)
  })

  /**
   * Empty category, rejected.
   */
  it('rejects an empty category', () => {
    const result = createProductSchema.safeParse({ name: 'Test', category: '', priceCents: 500 })

    expect(result.success).toBe(false)
  })

  /**
   * Negative price, rejected.
   *
   * `priceCents` must never go negative; a negative value would misrepresent
   * the product's cost.
   */
  it('rejects a negative priceCents', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      category: 'office',
      priceCents: -1,
    })

    expect(result.success).toBe(false)
  })

  /**
   * Non-integer price, rejected.
   *
   * Prices are integer cents; a fractional value would indicate a caller
   * passing a floating-point currency amount instead.
   */
  it('rejects a non-integer priceCents', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      category: 'office',
      priceCents: 5.5,
    })

    expect(result.success).toBe(false)
  })

  /**
   * Missing field, rejected.
   *
   * Omitting a required field must fail rather than defaulting silently.
   */
  it('rejects a payload missing priceCents', () => {
    const result = createProductSchema.safeParse({ name: 'Test', category: 'office' })

    expect(result.success).toBe(false)
  })
})
