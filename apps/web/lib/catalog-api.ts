/**
 * @fileoverview Typed wrapper over the demo product catalog.
 *
 * Backs both the Errors page (the catalog-driven not-found, validation, and
 * seasonal-domain-code triggers) and the Pagination page (offset and cursor
 * listing, added alongside its own task).
 *
 * @layer data
 */

import { request } from './api-client'
import type { ApiResult } from './api-client'

/** A single catalog product, mirroring the API's `Product` shape. */
export interface Product {
  /** Stable identifier, unique within the catalog. */
  readonly id: string
  /** Display name. */
  readonly name: string
  /** Free-form category label; `'seasonal'` drives the out-of-season demo. */
  readonly category: string
  /** Price in integer cents. */
  readonly priceCents: number
  /** ISO 8601 creation instant. */
  readonly createdAt: string
}

/**
 * An id guaranteed to be absent from the seeded catalog (the seed is bounded
 * by `CATALOG_SEED_COUNT`, whose documented default is 240), used by the
 * Errors page to deterministically trigger `BYMAX_NOT_FOUND`.
 */
export const NOT_FOUND_DEMO_PRODUCT_ID = 'p-999999'

/**
 * A seeded product id guaranteed to be `'seasonal'`: the repository rotates
 * `CATEGORIES` by index modulo 5, and index 4 (`p-000005`, one-based) always
 * lands on `'seasonal'`. Used by the Errors page to deterministically
 * trigger the custom `CATALOG_OUT_OF_SEASON` domain code.
 */
export const SEASONAL_DEMO_PRODUCT_ID = 'p-000005'

/**
 * Look up a single product by id.
 *
 * @param id - The product id to look up.
 * @returns The product, or the `BYMAX_NOT_FOUND` envelope for an unknown id.
 */
export function getProduct(id: string): Promise<ApiResult<Product>> {
  return request<Product>(`/catalog/products/${id}`)
}

/**
 * Look up a product enforcing the seasonal availability rule.
 *
 * @param id - The product id to look up.
 * @returns The product when in season, or the `CATALOG_OUT_OF_SEASON`
 *   envelope when the product's category is `'seasonal'`.
 */
export function getSeasonalProduct(id: string): Promise<ApiResult<Product>> {
  return request<Product>(`/catalog/products/${id}/seasonal`)
}

/**
 * Deliberately POST an empty body to `/catalog/products` to trigger the
 * catalog's Zod validation rejection.
 *
 * @returns The `BYMAX_VALIDATION_FAILED` envelope, or a transport failure.
 */
export function triggerCatalogValidationError(): Promise<ApiResult<never>> {
  return request<never>('/catalog/products', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })
}
