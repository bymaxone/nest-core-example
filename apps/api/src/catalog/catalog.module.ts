/**
 * @fileoverview Feature module wiring the catalog controller, service, and
 * in-memory repository together.
 * @layer module
 */

import { Module } from '@nestjs/common'

import { CatalogController } from './catalog.controller.js'
import { CatalogService } from './catalog.service.js'
import { ProductRepository } from './product.repository.js'

/**
 * Registers the catalog controller, service, and repository.
 */
@Module({
  controllers: [CatalogController],
  providers: [CatalogService, ProductRepository],
})
export class CatalogModule {}
