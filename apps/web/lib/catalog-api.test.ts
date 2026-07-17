/**
 * Unit tests for the catalog wrapper's single-lookup and validation-trigger
 * helpers.
 *
 * Layer: unit.
 * Goal: verify each function calls the documented path/method through the
 *   shared `request()` client and returns its result untouched.
 * Mocks: `./api-client#request`.
 */

import { describe, expect, it, vi } from 'vitest'

import {
  NOT_FOUND_DEMO_PRODUCT_ID,
  SEASONAL_DEMO_PRODUCT_ID,
  getProduct,
  getSeasonalProduct,
  triggerCatalogValidationError,
} from './catalog-api'
import { request } from './api-client'

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>()
  return { ...actual, request: vi.fn() }
})

describe('getProduct', () => {
  /**
   * Path and passthrough.
   *
   * Requests `GET /catalog/products/:id` for the given id.
   */
  it('requests the product by id and returns the result', async () => {
    // Arrange
    const payload = { ok: true as const, data: { id: 'p-000001' } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await getProduct(NOT_FOUND_DEMO_PRODUCT_ID)

    // Assert
    expect(request).toHaveBeenCalledWith(`/catalog/products/${NOT_FOUND_DEMO_PRODUCT_ID}`)
    expect(result).toBe(payload)
  })
})

describe('getSeasonalProduct', () => {
  /**
   * Path and passthrough.
   *
   * Requests `GET /catalog/products/:id/seasonal` for the given id.
   */
  it('requests the seasonal lookup and returns the result', async () => {
    // Arrange
    const payload = { ok: true as const, data: { id: SEASONAL_DEMO_PRODUCT_ID } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await getSeasonalProduct(SEASONAL_DEMO_PRODUCT_ID)

    // Assert
    expect(request).toHaveBeenCalledWith(`/catalog/products/${SEASONAL_DEMO_PRODUCT_ID}/seasonal`)
    expect(result).toBe(payload)
  })
})

describe('triggerCatalogValidationError', () => {
  /**
   * Path, method, and empty JSON body.
   *
   * POSTs an empty object to `/catalog/products`, which fails the catalog's
   * `name.min(1)` rule and surfaces `BYMAX_VALIDATION_FAILED`.
   */
  it('posts an empty JSON body to /catalog/products', async () => {
    // Arrange
    const payload = { ok: false as const, kind: 'envelope' as const, error: {} as never }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await triggerCatalogValidationError()

    // Assert
    expect(request).toHaveBeenCalledWith('/catalog/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    expect(result).toBe(payload)
  })
})
