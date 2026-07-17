/**
 * @fileoverview REST surface for the demo product catalog: single lookup, the
 * offset pagination model, a Zod-validated create, and a seasonal-availability
 * demo of explicit domain-code passthrough. Thin controller; all logic lives
 * in `CatalogService`.
 * @layer controller
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import type { PageResult } from '@bymax-one/nest-core/pagination'

import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import { CatalogService } from './catalog.service.js'
import { createProductSchema } from './dto/create-product.dto.js'
import type { CreateProductInput } from './dto/create-product.dto.js'
import type { Product } from './product.types.js'

/**
 * Product catalog controller.
 */
@Controller('catalog/products')
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  /**
   * List products with offset pagination.
   *
   * @param raw - Raw `page` and `limit` query parameters.
   * @returns A clamped page of products with derived meta.
   */
  @Get()
  listOffset(@Query() raw: Record<string, unknown>): Promise<PageResult<Product>> {
    return this.catalog.listOffset(raw)
  }

  /**
   * Create a new product.
   *
   * @param input - The Zod-validated request body.
   * @returns The persisted product.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createProduct(
    @Body(new ZodValidationPipe(createProductSchema)) input: CreateProductInput,
  ): Promise<Product> {
    return this.catalog.createProduct(input)
  }

  /**
   * Look up a single product, enforcing the seasonal availability rule.
   *
   * @param id - The product id from the route.
   * @returns The product when it is currently in season.
   * @throws OutOfSeasonError when the product's category is `'seasonal'`.
   */
  @Get(':id/seasonal')
  getSeasonalProduct(@Param('id') id: string): Promise<Product> {
    return this.catalog.getSeasonalProduct(id)
  }

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
