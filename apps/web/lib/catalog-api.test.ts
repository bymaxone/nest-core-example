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
  listCursorProducts,
  listOffsetProducts,
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

describe('listOffsetProducts', () => {
  /**
   * Query string and passthrough.
   *
   * Requests `GET /catalog/products?page=&limit=` with both values in the
   * query string.
   */
  it('requests the offset page with page and limit in the query string', async () => {
    // Arrange
    const payload = {
      ok: true as const,
      data: { items: [], meta: { page: 2, limit: 10, totalItems: 240, totalPages: 24 } },
    }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await listOffsetProducts(2, 10)

    // Assert
    expect(request).toHaveBeenCalledWith('/catalog/products?page=2&limit=10')
    expect(result).toBe(payload)
  })
})

describe('listCursorProducts', () => {
  /**
   * First page, no cursor.
   *
   * Omitting the cursor must not add a `cursor` query param at all, so the
   * server-side "cursor absent" branch is exercised for the first page.
   */
  it('omits the cursor param for the first page', async () => {
    // Arrange
    const payload = { ok: true as const, data: { items: [], nextCursor: 'abc' } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await listCursorProducts(undefined, 20)

    // Assert
    expect(request).toHaveBeenCalledWith('/catalog/products/cursor?limit=20')
    expect(result).toBe(payload)
  })

  /**
   * Subsequent page, cursor passed through untouched.
   *
   * A valid opaque cursor is forwarded verbatim in the query string, never
   * decoded or re-encoded client-side.
   */
  it('forwards a valid cursor untouched', async () => {
    // Arrange
    const payload = { ok: true as const, data: { items: [], nextCursor: null } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await listCursorProducts('eyJpZCI6InAtMDAwMDAyIn0', 20)

    // Assert
    expect(request).toHaveBeenCalledWith(
      '/catalog/products/cursor?limit=20&cursor=eyJpZCI6InAtMDAwMDAyIn0',
    )
    expect(result).toBe(payload)
  })

  /**
   * Tampered cursor, forwarded verbatim.
   *
   * The "corrupt the cursor" demo passes an intentionally malformed string;
   * this wrapper never validates it client-side, so the server's
   * `BYMAX_VALIDATION_FAILED` rejection is what the caller observes.
   */
  it('forwards a tampered cursor verbatim, exercising no client-side validation', async () => {
    // Arrange
    const payload = {
      ok: false as const,
      kind: 'envelope' as const,
      error: { code: 'BYMAX_VALIDATION_FAILED' } as never,
    }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await listCursorProducts('not-a-real-cursor', 20)

    // Assert
    expect(request).toHaveBeenCalledWith(
      '/catalog/products/cursor?limit=20&cursor=not-a-real-cursor',
    )
    expect(result).toBe(payload)
  })
})
