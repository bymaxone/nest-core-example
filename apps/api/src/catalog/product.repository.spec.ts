/**
 * Unit tests for ProductRepository.
 *
 * Layer: unit.
 * Goal: verify deterministic seeding, latency simulation, offset slicing,
 * cursor-relative fetching, and appended creation.
 * Mocks: a ConfigService stub supplying the seed count and origin latency.
 */

import type { ConfigService } from '@nestjs/config'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

import type { Env } from '../config/env.schema.js'
import { ProductRepository } from './product.repository.js'

/** Build a repository with the given seed count and origin latency. */
function buildRepository(seedCount: number, originLatencyMs = 0): ProductRepository {
  const values: Record<string, number> = {
    CATALOG_SEED_COUNT: seedCount,
    CATALOG_ORIGIN_LATENCY_MS: originLatencyMs,
  }
  const config = {
    get: (key: string) => values[key],
  } as unknown as ConfigService<Env, true>
  return new ProductRepository(config)
}

describe('ProductRepository', () => {
  /**
   * Deterministic seed, cross-instance.
   *
   * Two repositories built from the same seed count must produce byte-for-byte
   * identical catalogs, proving the generator is a pure function of index and
   * never touches `Math.random`.
   */
  it('generates the same seed across independent instances', async () => {
    const first = buildRepository(20)
    const second = buildRepository(20)

    const firstPage = await first.findPage({ page: 1, limit: 20 })
    const secondPage = await second.findPage({ page: 1, limit: 20 })

    expect(firstPage.rows).toEqual(secondPage.rows)
  })

  /**
   * Seed shape and category rotation.
   *
   * Every fifth product (index 4, 9, ...) must land on the `'seasonal'`
   * category so the out-of-season demo has a deterministic, discoverable
   * target.
   */
  it('rotates categories so every fifth product is seasonal', async () => {
    const repository = buildRepository(10)

    const page = await repository.findPage({ page: 1, limit: 10 })

    expect(page.rows[4]?.category).toBe('seasonal')
    expect(page.rows[9]?.category).toBe('seasonal')
    expect(page.rows[0]?.category).not.toBe('seasonal')
  })

  describe('latency simulation', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    /**
     * Awaited artificial latency.
     *
     * `findById` must not resolve until the configured origin latency has
     * elapsed, proving the delay is truly awaited rather than a no-op.
     */
    it('awaits the configured origin latency before resolving findById', async () => {
      const repository = buildRepository(1, 1000)
      let resolved = false

      const pending = repository.findById('p-000001').then((product) => {
        resolved = true
        return product
      })

      await Promise.resolve()
      expect(resolved).toBe(false)

      await jest.advanceTimersByTimeAsync(1000)
      await pending

      expect(resolved).toBe(true)
    })
  })

  /**
   * Offset slicing, boundary case.
   *
   * A page beyond the seeded catalog must return an empty slice while still
   * reporting the true total, so `buildPageResult` can derive correct meta.
   */
  it('returns an empty slice and the true total past the last page', async () => {
    const repository = buildRepository(5)

    const page = await repository.findPage({ page: 3, limit: 5 })

    expect(page.rows).toEqual([])
    expect(page.total).toBe(5)
  })

  /**
   * Cursor walk from the start.
   *
   * With no prior cursor, `findAfter` must return rows from the very first
   * product.
   */
  it('starts from the beginning when no cursor is supplied', async () => {
    const repository = buildRepository(5)

    const rows = await repository.findAfter(undefined, 2)

    expect(rows.map((product) => product.id)).toEqual(['p-000001', 'p-000002'])
  })

  /**
   * Cursor walk continuation.
   *
   * Given a prior position, `findAfter` must resume strictly after it,
   * ordered by id, which is what lets the cursor endpoint walk the catalog
   * page by page.
   */
  it('resumes strictly after the given cursor position', async () => {
    const repository = buildRepository(5)

    const rows = await repository.findAfter({ id: 'p-000002' }, 2)

    expect(rows.map((product) => product.id)).toEqual(['p-000003', 'p-000004'])
  })

  /**
   * Unresolved cursor id, defensive fallback.
   *
   * A cursor referencing an id no longer in the catalog restarts the walk
   * from the beginning instead of throwing, since catalog ids are public and
   * never sensitive.
   */
  it('restarts from the beginning when the cursor id is not found', async () => {
    const repository = buildRepository(5)

    const rows = await repository.findAfter({ id: 'does-not-exist' }, 2)

    expect(rows.map((product) => product.id)).toEqual(['p-000001', 'p-000002'])
  })

  /**
   * Created products are appended and independently identified.
   *
   * `create` must persist a new product with a generated id and timestamp,
   * distinct from the deterministic seed, and it must become visible to
   * subsequent reads.
   */
  it('appends a created product with a generated id and timestamp', async () => {
    const repository = buildRepository(2)

    const created = await repository.create({
      name: 'Test Item',
      category: 'office',
      priceCents: 1234,
    })

    // The created product continues the seeded id sequence (2 seeded -> p-000003),
    // keeping insertion order consistent with id order.
    expect(created.id).toBe('p-000003')
    expect(created.createdAt).toEqual(expect.any(String))
    expect(created.name).toBe('Test Item')

    const found = await repository.findById(created.id)
    expect(found).toEqual(created)
  })
})
