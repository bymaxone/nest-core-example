/**
 * Unit tests for CatalogController.
 *
 * Layer: unit.
 * Goal: verify every route delegates to CatalogService with the right
 * arguments and returns its result unchanged; the controller holds no logic.
 * Mocks: a CatalogService stub with jest.fn() per method.
 */

import { describe, expect, it, jest } from '@jest/globals'

import { CatalogController } from './catalog.controller.js'
import type { CatalogService } from './catalog.service.js'
import type { Product } from './product.types.js'

/** Typed mock shape for each service method exercised by these tests. */
interface ServiceStub {
  listOffset: jest.Mock<CatalogService['listOffset']>
  createProduct: jest.Mock<CatalogService['createProduct']>
  getSeasonalProduct: jest.Mock<CatalogService['getSeasonalProduct']>
  getProduct: jest.Mock<CatalogService['getProduct']>
}

/** Build a fully-mocked service stub; every method defaults to an unset jest.fn(). */
function buildServiceStub(): ServiceStub {
  return {
    listOffset: jest.fn<CatalogService['listOffset']>(),
    createProduct: jest.fn<CatalogService['createProduct']>(),
    getSeasonalProduct: jest.fn<CatalogService['getSeasonalProduct']>(),
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
   * Offset listing delegation.
   *
   * The raw query object must reach the service untouched.
   */
  it('delegates listOffset to the service with the raw query', async () => {
    const stub = buildServiceStub()
    stub.listOffset.mockResolvedValue({
      items: [product],
      meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
    })
    const controller = buildController(stub)
    const raw = { page: '1', limit: '20' }

    const result = await controller.listOffset(raw)

    expect(stub.listOffset).toHaveBeenCalledWith(raw)
    expect(result.items).toEqual([product])
  })

  /**
   * Create delegation.
   *
   * The pipe-validated body must reach the service untouched and the
   * persisted product must come back as-is.
   */
  it('delegates createProduct to the service with the validated body', async () => {
    const stub = buildServiceStub()
    stub.createProduct.mockResolvedValue(product)
    const controller = buildController(stub)
    const input = { name: 'Test Item', category: 'electronics', priceCents: 999 }

    const result = await controller.createProduct(input)

    expect(stub.createProduct).toHaveBeenCalledWith(input)
    expect(result).toEqual(product)
  })

  /**
   * Seasonal lookup delegation.
   *
   * The route id param must reach the service untouched.
   */
  it('delegates getSeasonalProduct to the service with the id param', async () => {
    const stub = buildServiceStub()
    stub.getSeasonalProduct.mockResolvedValue(product)
    const controller = buildController(stub)

    const result = await controller.getSeasonalProduct('p-000001')

    expect(stub.getSeasonalProduct).toHaveBeenCalledWith('p-000001')
    expect(result).toEqual(product)
  })

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
