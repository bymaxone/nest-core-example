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

/** Pagination metadata describing the position within the full result set. */
export interface PageMeta {
  /** The 1-based page this result represents. */
  readonly page: number
  /** The page size used to compute the slice. */
  readonly limit: number
  /** Total number of items across all pages. */
  readonly totalItems: number
  /** Total number of pages, `0` when there are no items. */
  readonly totalPages: number
}

/** A page of products plus its computed {@link PageMeta}. */
export interface PageResult {
  /** The items on this page. */
  readonly items: readonly Product[]
  /** Metadata describing this page within the full set. */
  readonly meta: PageMeta
}

/** A page of products plus the cursor for the next page, if any. */
export interface CursorResult {
  /** The items on this page, trimmed to the requested limit. */
  readonly items: readonly Product[]
  /** The cursor for the next page, or `null` when this is the last page. */
  readonly nextCursor: string | null
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

/**
 * List products with offset pagination.
 *
 * @param page - 1-based page index; clamped server-side to `>= 1`.
 * @param limit - Page size; clamped server-side to `[1, 50]`.
 * @returns The requested page and its derived meta, or an API/transport failure.
 */
export function listOffsetProducts(page: number, limit: number): Promise<ApiResult<PageResult>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<PageResult>(`/catalog/products?${params.toString()}`)
}

/**
 * List products with opaque-cursor pagination.
 *
 * The cursor is passed through untouched: it is never parsed or validated
 * client-side, matching the library's opaque-cursor contract. Passing a
 * tampered value deliberately (the Pagination page's "corrupt the cursor"
 * demo) is exactly how a caller reproduces `BYMAX_VALIDATION_FAILED`.
 *
 * @param cursor - The opaque cursor from a prior page, or undefined for the first page.
 * @param limit - Page size; clamped server-side to `[1, 50]`.
 * @returns The requested page and the next cursor, or an API/transport failure.
 */
export function listCursorProducts(
  cursor: string | undefined,
  limit: number,
): Promise<ApiResult<CursorResult>> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor !== undefined) {
    params.set('cursor', cursor)
  }
  return request<CursorResult>(`/catalog/products/cursor?${params.toString()}`)
}
