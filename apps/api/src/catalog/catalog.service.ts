/**
 * @fileoverview Business logic for the demo product catalog. Turns raw,
 * untrusted request input into calls against `ProductRepository` and the
 * library's pagination helpers; controllers stay thin, and every pagination
 * decision (clamping, meta, cursor codec) is made here or delegated to the
 * library, never hand-rolled.
 * @layer service
 */

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  buildCursorResult,
  buildPageResult,
  decodeCursor,
  normalizeCursorQuery,
  normalizePageQuery,
} from '@bymax-one/nest-core/pagination'
import type { CursorResult, PageResult } from '@bymax-one/nest-core/pagination'

import { OutOfSeasonError } from '../common/domain-errors.js'
import type { CreateProductInput } from './dto/create-product.dto.js'
import { ProductRepository } from './product.repository.js'
import type { Product } from './product.types.js'

/** Page-size ceiling shared by both pagination models for this domain. */
const MAX_PAGE_LIMIT = 50

/**
 * Seeded product catalog demonstrating both pagination models over an
 * in-memory repository (the library is ORM-agnostic; so is this demo).
 */
@Injectable()
export class CatalogService {
  constructor(@Inject(ProductRepository) private readonly products: ProductRepository) {}

  /**
   * Look up a single product by id.
   *
   * @param id - The product id to look up.
   * @returns The matching product.
   * @throws NotFoundException when no product has the given id.
   */
  async getProduct(id: string): Promise<Product> {
    const product = await this.products.findById(id)
    if (product === undefined) {
      throw new NotFoundException(`Product ${id} was not found`)
    }
    return product
  }

  /**
   * List products with offset pagination.
   *
   * @param raw - Unvalidated query input (page, limit).
   * @returns A PageResult with clamped meta derived by the library helpers.
   */
  async listOffset(raw: Record<string, unknown>): Promise<PageResult<Product>> {
    const query = normalizePageQuery(raw, { maxLimit: MAX_PAGE_LIMIT })
    const { rows, total } = await this.products.findPage(query)
    return buildPageResult(rows, total, query)
  }

  /**
   * List products with opaque-cursor pagination.
   *
   * @param raw - Unvalidated query input (cursor, limit).
   * @returns A CursorResult; `nextCursor` is `null` on the last page.
   * @throws BadRequestException when the supplied cursor is malformed
   *   (propagated untouched from `decodeCursor`).
   */
  async listCursor(raw: Record<string, unknown>): Promise<CursorResult<Product>> {
    const query = normalizeCursorQuery(raw, { maxLimit: MAX_PAGE_LIMIT })
    const after =
      query.cursor !== undefined ? decodeCursor<{ id: string }>(query.cursor) : undefined
    const rows = await this.products.findAfter(after, query.limit + 1)
    return buildCursorResult(rows, query.limit, (last) => ({ id: last.id }))
  }

  /**
   * Create a new product from validated input.
   *
   * @param input - The Zod-validated fields for the new product.
   * @returns The persisted product.
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    return this.products.create(input)
  }

  /**
   * Look up a product and enforce the seasonal availability rule.
   *
   * @param id - The product id to look up.
   * @returns The product when it is currently in season.
   * @throws NotFoundException when no product has the given id.
   * @throws OutOfSeasonError when the product's category is `'seasonal'`.
   */
  async getSeasonalProduct(id: string): Promise<Product> {
    const product = await this.getProduct(id)
    if (product.category === 'seasonal') {
      throw new OutOfSeasonError(product.id)
    }
    return product
  }
}
