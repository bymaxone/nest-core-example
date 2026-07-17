/**
 * Unit tests for OutOfSeasonError.
 *
 * Layer: unit.
 * Goal: verify the custom-code response shape and HTTP status the library's
 * exception filter passes through verbatim.
 * Mocks: none, plain exception construction.
 */

import { HttpStatus } from '@nestjs/common'
import { describe, expect, it } from '@jest/globals'

import { OutOfSeasonError } from './domain-errors.js'

describe('OutOfSeasonError', () => {
  /**
   * Custom-code response shape.
   *
   * The response body must carry the explicit `CATALOG_OUT_OF_SEASON` code
   * and a message naming the product, never a `BYMAX_`-prefixed code.
   */
  it('carries the CATALOG_OUT_OF_SEASON code and a message naming the product', () => {
    const error = new OutOfSeasonError('p-000042')

    expect(error.getResponse()).toEqual({
      code: 'CATALOG_OUT_OF_SEASON',
      message: 'Product p-000042 is currently out of season',
    })
  })

  /**
   * HTTP status.
   *
   * The error must map to HTTP 409 (conflict), matching a seasonal item that
   * exists but cannot currently be sold.
   */
  it('uses HTTP 409 Conflict', () => {
    const error = new OutOfSeasonError('p-000042')

    expect(error.getStatus()).toBe(HttpStatus.CONFLICT)
  })
})
