/**
 * Unit tests for the mirrored error-envelope contract.
 *
 * Layer: unit.
 * Goal: pin the envelope's field names and the full BYMAX_* code catalog
 *   against the documented library contract, and exercise every branch of
 *   the `isErrorEnvelope` type guard, so a drift between this hand-mirrored
 *   module and the real library fails a test here instead of silently
 *   misrendering an error response in the UI.
 * Mocks: none. Both exports are pure.
 */

import { describe, expect, it } from 'vitest'

import { BYMAX_ERROR_CODES, isErrorEnvelope, type ErrorEnvelope } from './envelope'

describe('BYMAX_ERROR_CODES', () => {
  /**
   * Full catalog pin.
   *
   * The library exports exactly these 16 stable codes; a rename, addition,
   * or removal in `@bymax-one/nest-core` must be mirrored here deliberately,
   * not discovered as a silent runtime mismatch in the Errors page.
   */
  it('pins the exact 16-code catalog in the documented order', () => {
    expect(BYMAX_ERROR_CODES).toEqual([
      'BYMAX_BAD_REQUEST',
      'BYMAX_VALIDATION_FAILED',
      'BYMAX_UNAUTHORIZED',
      'BYMAX_FORBIDDEN',
      'BYMAX_NOT_FOUND',
      'BYMAX_CONFLICT',
      'BYMAX_PAYLOAD_TOO_LARGE',
      'BYMAX_UNSUPPORTED_MEDIA_TYPE',
      'BYMAX_UNPROCESSABLE_ENTITY',
      'BYMAX_TOO_MANY_REQUESTS',
      'BYMAX_CLIENT_ERROR',
      'BYMAX_INTERNAL_ERROR',
      'BYMAX_NOT_IMPLEMENTED',
      'BYMAX_BAD_GATEWAY',
      'BYMAX_SERVICE_UNAVAILABLE',
      'BYMAX_GATEWAY_TIMEOUT',
    ])
  })

  /**
   * No accidental duplicates.
   *
   * Every entry must be distinct: a duplicate would silently shrink the
   * catalog a consumer iterates over (for example the Errors page's trigger
   * grid) without changing the array's length.
   */
  it('contains no duplicate codes', () => {
    expect(new Set(BYMAX_ERROR_CODES).size).toBe(BYMAX_ERROR_CODES.length)
  })
})

describe('isErrorEnvelope', () => {
  /**
   * Full-contract happy path.
   *
   * A response carrying every field (including the optional ones) must be
   * recognized as an envelope.
   */
  it('returns true for a fully-populated envelope', () => {
    // Arrange
    const value: ErrorEnvelope = {
      statusCode: 409,
      code: 'BYMAX_CONFLICT',
      message: 'Demo conflict failure',
      details: { reason: 'duplicate' },
      correlationId: 'req-123',
      timestamp: '2026-01-01T00:00:00.000Z',
      path: '/failures/conflict',
    }

    // Act
    const result = isErrorEnvelope(value)

    // Assert
    expect(result).toBe(true)
  })

  /**
   * Minimal-contract happy path.
   *
   * `details` and `correlationId` are documented as optional; an envelope
   * carrying only the five always-present fields must still pass.
   */
  it('returns true when only the always-present fields are set', () => {
    // Arrange
    const value = {
      statusCode: 404,
      code: 'BYMAX_NOT_FOUND',
      message: 'Product p-999999 was not found',
      timestamp: '2026-01-01T00:00:00.000Z',
      path: '/catalog/products/p-999999',
    }

    // Act & Assert
    expect(isErrorEnvelope(value)).toBe(true)
  })

  /**
   * Domain code passthrough.
   *
   * A custom, non-`BYMAX_` code (for example `CATALOG_OUT_OF_SEASON`) is a
   * valid envelope too: the guard checks field types, not catalog membership.
   */
  it('returns true for a non-BYMAX_ domain code', () => {
    // Arrange
    const value = {
      statusCode: 409,
      code: 'CATALOG_OUT_OF_SEASON',
      message: 'Product p-000005 is currently out of season',
      timestamp: '2026-01-01T00:00:00.000Z',
      path: '/catalog/products/p-000005/seasonal',
    }

    // Act & Assert
    expect(isErrorEnvelope(value)).toBe(true)
  })

  /**
   * Non-object rejection.
   *
   * Primitives and null can never structurally match the envelope shape.
   */
  it('returns false for null and for primitives', () => {
    expect(isErrorEnvelope(null)).toBe(false)
    expect(isErrorEnvelope('not an envelope')).toBe(false)
    expect(isErrorEnvelope(42)).toBe(false)
  })

  /**
   * Array edge case.
   *
   * `typeof [] === 'object'` in JavaScript, so an array reaches the field
   * checks rather than being short-circuited by the `typeof` guard; it is
   * correctly rejected there for lacking every required field.
   */
  it('returns false for an array (structurally missing every required field)', () => {
    expect(isErrorEnvelope([1, 2, 3])).toBe(false)
  })

  /**
   * Missing-field rejection, one case per always-present field.
   *
   * Each documented required field must independently gate the guard, so a
   * response missing any single one of them is never misread as valid.
   */
  it.each([
    ['statusCode', { code: 'BYMAX_BAD_REQUEST', message: 'm', timestamp: 't', path: 'p' }],
    ['code', { statusCode: 400, message: 'm', timestamp: 't', path: 'p' }],
    ['message', { statusCode: 400, code: 'BYMAX_BAD_REQUEST', timestamp: 't', path: 'p' }],
    ['timestamp', { statusCode: 400, code: 'BYMAX_BAD_REQUEST', message: 'm', path: 'p' }],
    ['path', { statusCode: 400, code: 'BYMAX_BAD_REQUEST', message: 'm', timestamp: 't' }],
  ])('returns false when %s is missing', (_field, value) => {
    expect(isErrorEnvelope(value)).toBe(false)
  })

  /**
   * Wrong-type rejection.
   *
   * A field present with the wrong JavaScript type (a stringified status
   * code) must fail the same as a missing field.
   */
  it('returns false when statusCode is a string instead of a number', () => {
    const value = {
      statusCode: '400',
      code: 'BYMAX_BAD_REQUEST',
      message: 'm',
      timestamp: 't',
      path: 'p',
    }
    expect(isErrorEnvelope(value)).toBe(false)
  })
})
