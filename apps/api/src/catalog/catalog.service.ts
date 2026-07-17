/**
 * @fileoverview Business logic for the demo product catalog. Turns raw,
 * untrusted request input into calls against `ProductRepository`; controllers
 * stay thin, and every pagination decision (clamping, meta, cursor codec) is
 * delegated to the library, never hand-rolled.
 * @layer service
 */

import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { ProductRepository } from './product.repository.js'
import type { Product } from './product.types.js'

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
}
