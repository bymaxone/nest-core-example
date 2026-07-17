/**
 * Unit tests for CatalogService.
 *
 * Layer: unit.
 * Goal: verify the 404 lookup path, offset clamping via the library helpers,
 * cursor pagination including tampered-cursor propagation, create delegation,
 * and the seasonal domain-error passthrough.
 * Mocks: a ProductRepository stub returning fixed rows/products.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common'
import { decodeCursor, encodeCursor } from '@bymax-one/nest-core/pagination'
import { describe, expect, it, jest } from '@jest/globals'

import { OutOfSeasonError } from '../common/domain-errors.js'
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
  findPage: jest.Mock<ProductRepository['findPage']>
  findAfter: jest.Mock<ProductRepository['findAfter']>
  create: jest.Mock<ProductRepository['create']>
}

/** Build a fully-mocked repository stub; every method defaults to an unset jest.fn(). */
function buildRepositoryStub(): RepositoryStub {
  return {
    findById: jest.fn<ProductRepository['findById']>(),
    findPage: jest.fn<ProductRepository['findPage']>(),
    findAfter: jest.fn<ProductRepository['findAfter']>(),
    create: jest.fn<ProductRepository['create']>(),
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

  describe('listOffset', () => {
    /**
     * Clamp table: below-range page.
     *
     * `page=0` must clamp up to `1`, matching the library's documented floor.
     */
    it('clamps a below-range page to 1', async () => {
      const stub = buildRepositoryStub()
      stub.findPage.mockResolvedValue({ rows: [], total: 0 })
      const service = buildService(stub)

      const result = await service.listOffset({ page: 0, limit: 10 })

      expect(result.meta.page).toBe(1)
      expect(stub.findPage).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    /**
     * Clamp table: above-range limit.
     *
     * `limit=999` must clamp down to the service's configured ceiling of `50`.
     */
    it('clamps an above-range limit to the 50-item ceiling', async () => {
      const stub = buildRepositoryStub()
      stub.findPage.mockResolvedValue({ rows: [], total: 0 })
      const service = buildService(stub)

      const result = await service.listOffset({ page: 1, limit: 999 })

      expect(result.meta.limit).toBe(50)
      expect(stub.findPage).toHaveBeenCalledWith({ page: 1, limit: 50 })
    })

    /**
     * Clamp table: defaults.
     *
     * Absent `page`/`limit` must fall back to the library's documented
     * defaults (page 1, limit 20).
     */
    it('applies the documented defaults when page and limit are absent', async () => {
      const stub = buildRepositoryStub()
      stub.findPage.mockResolvedValue({ rows: [], total: 0 })
      const service = buildService(stub)

      const result = await service.listOffset({})

      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(20)
    })

    /**
     * Meta derivation.
     *
     * `totalPages` must be derived by the library from the repository's total
     * count, never computed by hand in this service.
     */
    it('derives totalPages from the repository total via buildPageResult', async () => {
      const rows = [buildProduct()]
      const stub = buildRepositoryStub()
      stub.findPage.mockResolvedValue({ rows, total: 21 })
      const service = buildService(stub)

      const result = await service.listOffset({ page: 1, limit: 10 })

      expect(result.items).toEqual(rows)
      expect(result.meta.totalItems).toBe(21)
      expect(result.meta.totalPages).toBe(3)
    })
  })

  describe('listCursor', () => {
    /**
     * First page, no cursor.
     *
     * Without a cursor, the repository must be asked for rows starting from
     * the beginning, fetching one extra row per the fetch-one-extra convention.
     */
    it('fetches limit + 1 rows from the start when no cursor is supplied', async () => {
      const rows = [buildProduct({ id: 'p-000001' }), buildProduct({ id: 'p-000002' })]
      const stub = buildRepositoryStub()
      stub.findAfter.mockResolvedValue(rows)
      const service = buildService(stub)

      const result = await service.listCursor({ limit: 1 })

      expect(stub.findAfter).toHaveBeenCalledWith(undefined, 2)
      expect(result.items).toEqual([rows[0]])
      expect(result.nextCursor).not.toBeNull()
      // The cursor must encode the last emitted row's ordering key (its id), so
      // decoding the opaque token round-trips to exactly that key, not an empty
      // object.
      expect(decodeCursor(result.nextCursor as string)).toEqual({ id: 'p-000001' })
    })

    /**
     * Cursor limit clamp.
     *
     * An over-range cursor limit must clamp to the service's 50-item ceiling
     * before the fetch-one-extra call, so the repository is asked for 51 rows
     * (50 + 1) rather than the raw requested value.
     */
    it('clamps an over-range cursor limit to the 50-item ceiling', async () => {
      const stub = buildRepositoryStub()
      stub.findAfter.mockResolvedValue([])
      const service = buildService(stub)

      await service.listCursor({ limit: 999 })

      expect(stub.findAfter).toHaveBeenCalledWith(undefined, 51)
    })

    /**
     * Continuation with a valid cursor.
     *
     * A well-formed cursor must decode to its ordering keys and the repository
     * must be asked to resume strictly after that position.
     */
    it('decodes a valid cursor and resumes after its position', async () => {
      const cursor = encodeCursor({ id: 'p-000002' })
      const stub = buildRepositoryStub()
      stub.findAfter.mockResolvedValue([])
      const service = buildService(stub)

      await service.listCursor({ cursor, limit: 5 })

      expect(stub.findAfter).toHaveBeenCalledWith({ id: 'p-000002' }, 6)
    })

    /**
     * Last page, walk termination.
     *
     * Exactly `limit` rows (no extra) must yield `nextCursor: null`.
     */
    it('yields nextCursor null on the last page', async () => {
      const rows = [buildProduct()]
      const stub = buildRepositoryStub()
      stub.findAfter.mockResolvedValue(rows)
      const service = buildService(stub)

      const result = await service.listCursor({ limit: 1 })

      expect(result.nextCursor).toBeNull()
    })

    /**
     * Tampered cursor rejection.
     *
     * A non-base64url cursor must propagate `decodeCursor`'s
     * `BadRequestException` untouched, which the library maps to
     * `BYMAX_VALIDATION_FAILED`.
     */
    it('propagates BadRequestException for a tampered cursor', async () => {
      const service = buildService(buildRepositoryStub())

      await expect(service.listCursor({ cursor: 'not-base64url!!!' })).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    /**
     * Truncated cursor rejection.
     *
     * A truncated (but base64url-shaped) cursor must also reject as a
     * `BadRequestException` rather than throwing an internal error.
     */
    it('propagates BadRequestException for a truncated cursor', async () => {
      const valid = encodeCursor({ id: 'p-000001' })
      const truncated = valid.slice(0, Math.max(1, valid.length - 4))
      const service = buildService(buildRepositoryStub())

      await expect(service.listCursor({ cursor: truncated })).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })
  })

  describe('createProduct', () => {
    /**
     * Create delegation.
     *
     * The service must pass the validated input straight to the repository
     * and return whatever it persists.
     */
    it('delegates creation to the repository and returns the persisted product', async () => {
      const created = buildProduct({ id: 'generated-id' })
      const stub = buildRepositoryStub()
      stub.create.mockResolvedValue(created)
      const service = buildService(stub)
      const input = { name: 'Test Item', category: 'office', priceCents: 500 }

      const result = await service.createProduct(input)

      expect(stub.create).toHaveBeenCalledWith(input)
      expect(result).toEqual(created)
    })
  })

  describe('getSeasonalProduct', () => {
    /**
     * In-season product.
     *
     * A non-seasonal category must resolve normally.
     */
    it('returns the product when its category is not seasonal', async () => {
      const product = buildProduct({ category: 'electronics' })
      const stub = buildRepositoryStub()
      stub.findById.mockResolvedValue(product)
      const service = buildService(stub)

      await expect(service.getSeasonalProduct('p-000001')).resolves.toEqual(product)
    })

    /**
     * Out-of-season product, custom-code passthrough.
     *
     * A `'seasonal'` category must throw `OutOfSeasonError` carrying the
     * explicit `CATALOG_OUT_OF_SEASON` code, which the library passes through
     * verbatim instead of deriving one from the HTTP status.
     */
    it('throws OutOfSeasonError with the custom code for a seasonal product', async () => {
      const product = buildProduct({ category: 'seasonal' })
      const stub = buildRepositoryStub()
      stub.findById.mockResolvedValue(product)
      const service = buildService(stub)

      try {
        await service.getSeasonalProduct('p-000001')
        throw new Error('expected getSeasonalProduct to throw')
      } catch (error) {
        expect(error).toBeInstanceOf(OutOfSeasonError)
        expect((error as OutOfSeasonError).getResponse()).toEqual({
          code: 'CATALOG_OUT_OF_SEASON',
          message: 'Product p-000001 is currently out of season',
        })
      }
    })

    /**
     * Missing product, 404 precedence.
     *
     * An unknown id must still surface `NotFoundException`, proving the
     * lookup failure is checked before the seasonal rule.
     */
    it('throws NotFoundException when the product does not exist', async () => {
      const stub = buildRepositoryStub()
      stub.findById.mockResolvedValue(undefined)
      const service = buildService(stub)

      await expect(service.getSeasonalProduct('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })
  })
})
