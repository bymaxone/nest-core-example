/**
 * Unit tests for CatalogService.
 *
 * Layer: unit.
 * Goal: verify the 404 lookup path.
 * Mocks: a ProductRepository stub returning fixed products.
 */

import { NotFoundException } from '@nestjs/common'
import { describe, expect, it, jest } from '@jest/globals'

import { CatalogService } from './catalog.service.js'
import type { ProductRepository } from './product.repository.js'
import type { Product } from './product.types.js'

/** Build a deterministic test product. */
function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p-000001',
    name: 'Test Item',
    category: 'electronics',
    priceCents: 999,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

/** Typed mock shape for each repository method exercised by these tests. */
interface RepositoryStub {
  findById: jest.Mock<ProductRepository['findById']>
}

/** Build a fully-mocked repository stub; every method defaults to an unset jest.fn(). */
function buildRepositoryStub(): RepositoryStub {
  return {
    findById: jest.fn<ProductRepository['findById']>(),
  }
}

/** Build a service wired to the given stub, cast to the repository's public type. */
function buildService(stub: RepositoryStub): CatalogService {
  return new CatalogService(stub as unknown as ProductRepository)
}

describe('CatalogService', () => {
  describe('getProduct', () => {
    /**
     * Successful lookup.
     *
     * A known id must resolve to the repository's product unchanged.
     */
    it('returns the product when the repository finds it', async () => {
      const product = buildProduct()
      const stub = buildRepositoryStub()
      stub.findById.mockResolvedValue(product)
      const service = buildService(stub)

      await expect(service.getProduct('p-000001')).resolves.toEqual(product)
    })

    /**
     * Unknown id, 404 path.
     *
     * A miss must throw `NotFoundException` naming the id, which the library
     * derives into the `BYMAX_NOT_FOUND` envelope.
     */
    it('throws NotFoundException naming the id when the product is missing', async () => {
      const stub = buildRepositoryStub()
      stub.findById.mockResolvedValue(undefined)
      const service = buildService(stub)

      await expect(service.getProduct('missing-id')).rejects.toThrow(
        new NotFoundException('Product missing-id was not found'),
      )
    })
  })
})
