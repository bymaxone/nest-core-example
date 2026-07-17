/**
 * @fileoverview Shape of the demo catalog domain entity. Deliberately tiny: an
 * in-memory product with no persistence concerns, so the pagination and error
 * demonstrations stay focused on the library surface rather than the domain.
 * @layer domain
 */

/** A single catalog product. */
export interface Product {
  /** Stable identifier, unique within the catalog. */
  readonly id: string
  /** Display name. */
  readonly name: string
  /** Free-form category label; the literal `'seasonal'` drives the out-of-season demo. */
  readonly category: string
  /** Price in integer cents, avoiding floating-point currency errors. */
  readonly priceCents: number
  /** ISO 8601 creation instant. */
  readonly createdAt: string
}
