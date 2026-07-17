/**
 * Unit tests for CatalogController.
 *
 * Layer: unit.
 * Goal: verify the single-lookup route delegates to CatalogService with the
 * right argument and returns its result unchanged; the controller holds no
 * logic.
 * Mocks: a CatalogService stub with jest.fn() per method.
 */

import { describe, expect, it, jest } from '@jest/globals'

import { CatalogController } from './catalog.controller.js'
import type { CatalogService } from './catalog.service.js'
import type { Product } from './product.types.js'

/** Typed mock shape for each service method exercised by these tests. */
interface ServiceStub {
  getProduct: jest.Mock<CatalogService['getProduct']>
}

/** Build a fully-mocked service stub; every method defaults to an unset jest.fn(). */
function buildServiceStub(): ServiceStub {
  return {
    getProduct: jest.fn<CatalogService['getProduct']>(),
  }
}

/** Build a controller wired to the given stub, cast to the service's public type. */
function buildController(stub: ServiceStub): CatalogController {
  return new CatalogController(stub as unknown as CatalogService)
}

const product: Product = {
  id: 'p-000001',
  name: 'Test Item',
  category: 'electronics',
  priceCents: 999,
  createdAt: '2024-01-01T00:00:00.000Z',
}

describe('CatalogController', () => {
  /**
   * Single lookup delegation.
   *
   * The route id param must reach the service untouched.
   */
  it('delegates getProduct to the service with the id param', async () => {
    const stub = buildServiceStub()
    stub.getProduct.mockResolvedValue(product)
    const controller = buildController(stub)

    const result = await controller.getProduct('p-000001')

    expect(stub.getProduct).toHaveBeenCalledWith('p-000001')
    expect(result).toEqual(product)
  })
})
