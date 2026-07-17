/**
 * @fileoverview REST surface for the demo product catalog. Thin controller;
 * all logic lives in `CatalogService`.
 * @layer controller
 */

import { Controller, Get, Inject, Param } from '@nestjs/common'

import { CatalogService } from './catalog.service.js'
import type { Product } from './product.types.js'

/**
 * Product catalog controller.
 */
@Controller('catalog/products')
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  /**
   * Look up a single product by id.
   *
   * @param id - The product id from the route.
   * @returns The matching product.
   */
  @Get(':id')
  getProduct(@Param('id') id: string): Promise<Product> {
    return this.catalog.getProduct(id)
  }
}
