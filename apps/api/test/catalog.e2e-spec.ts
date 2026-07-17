/**
 * @fileoverview E2E: the product catalog surface over real HTTP, covering
 * offset clamping, the cursor walk to `nextCursor: null`, a corrupted
 * cursor's explicit-code passthrough, the 404 single-lookup path, the
 * Zod-validated create (success and rejection), and the seasonal domain-code
 * demo (Feature-Coverage matrix rows 14-15, 21, 24, 43-51).
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { INestApplication } from '@nestjs/common'

import { createTestingApp } from './helpers/create-testing-app.js'
import { httpAgent } from './helpers/http.js'

/** Matches the deterministic seed baseline set for this suite (see the test helper). */
const SEED_COUNT = 20

describe('catalog', () => {
  let app: INestApplication

  beforeAll(async () => {
    ;({ app } = await createTestingApp())
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /catalog/products (offset pagination)', () => {
    /**
     * Default query clamps.
     *
     * An absent page/limit falls back to page 1 and the library's default
     * limit (20); with a 20-product seed, the full catalog fits on one page
     * and `totalPages` is exactly 1.
     */
    it('defaults to page 1 with the library default limit and derives totalPages', async () => {
      const response = await httpAgent(app).get('/catalog/products')

      expect(response.status).toBe(200)
      expect(response.body.items).toHaveLength(SEED_COUNT)
      expect(response.body.meta).toEqual({
        page: 1,
        limit: 20,
        totalItems: SEED_COUNT,
        totalPages: 1,
      })
    })

    /**
     * Clamp floor and ceiling.
     *
     * `page=0` floors to `1`; a `limit` far above the domain's 50-row ceiling
     * clamps down to 50 rather than being rejected.
     */
    it('clamps page below 1 up to 1 and limit above the domain ceiling down to 50', async () => {
      const response = await httpAgent(app).get('/catalog/products').query({ page: 0, limit: 999 })

      expect(response.status).toBe(200)
      expect(response.body.meta.page).toBe(1)
      expect(response.body.meta.limit).toBe(50)
    })
  })

  describe('GET /catalog/products/cursor (cursor pagination)', () => {
    /**
     * Full walk to the terminal cursor.
     *
     * Paging with `limit=5` over a 20-item seed takes exactly 4 requests to
     * exhaust the catalog; the final page's `nextCursor` is `null`, and every
     * item across the walk is unique (no overlap, no gap).
     */
    it('walks the full catalog to nextCursor: null with no duplicate items', async () => {
      const seenIds = new Set<string>()
      let cursor: string | undefined
      let pages = 0

      do {
        const response = await httpAgent(app)
          .get('/catalog/products/cursor')
          .query(cursor === undefined ? { limit: 5 } : { limit: 5, cursor })

        expect(response.status).toBe(200)
        for (const item of response.body.items as { id: string }[]) {
          expect(seenIds.has(item.id)).toBe(false)
          seenIds.add(item.id)
        }
        cursor = response.body.nextCursor ?? undefined
        pages += 1
      } while (cursor !== undefined)

      expect(pages).toBe(4)
      expect(seenIds.size).toBe(SEED_COUNT)
    })

    /**
     * Corrupted cursor: explicit-code passthrough.
     *
     * A cursor failing the base64url shape check rejects with the library's
     * own explicit `BYMAX_VALIDATION_FAILED` code (passed through verbatim,
     * not derived from the 400 status) and no `details` field.
     */
    it('rejects a corrupted cursor with the explicit BYMAX_VALIDATION_FAILED code', async () => {
      const response = await httpAgent(app)
        .get('/catalog/products/cursor')
        .query({ cursor: 'not-a-valid-cursor!!' })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'BYMAX_VALIDATION_FAILED',
        message: 'Malformed pagination cursor.',
      })
      expect(response.body.details).toBeUndefined()
    })
  })

  describe('GET /catalog/products/:id', () => {
    /** Successful single lookup returns the full product shape. */
    it('returns the matching product', async () => {
      const response = await httpAgent(app).get('/catalog/products/p-000001')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({ id: 'p-000001' })
    })

    /**
     * Unknown id: BYMAX_NOT_FOUND.
     *
     * A status-derived code (no explicit `code` on this exception), so the
     * envelope carries `BYMAX_NOT_FOUND` derived from the 404 status.
     */
    it('returns BYMAX_NOT_FOUND for an unknown id', async () => {
      const response = await httpAgent(app).get('/catalog/products/p-999999')

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        statusCode: 404,
        code: 'BYMAX_NOT_FOUND',
        message: 'Product p-999999 was not found',
      })
    })
  })

  describe('POST /catalog/products (Zod-validated create)', () => {
    /** A well-formed body persists and echoes a generated id and timestamp. */
    it('creates a product from a valid body', async () => {
      const response = await httpAgent(app)
        .post('/catalog/products')
        .send({ name: 'Test Widget', category: 'electronics', priceCents: 1234 })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        name: 'Test Widget',
        category: 'electronics',
        priceCents: 1234,
      })
      expect(response.body.id).toEqual(expect.any(String))
    })

    /**
     * Validation shape → BYMAX_VALIDATION_FAILED with structured details.
     *
     * An empty body violates all three required fields; the pipe's
     * `{path, message}` issues pass straight through as `details`.
     */
    it('rejects an empty body with BYMAX_VALIDATION_FAILED and structured details', async () => {
      const response = await httpAgent(app).post('/catalog/products').send({})

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'BYMAX_VALIDATION_FAILED',
        message: 'Validation failed',
      })
      expect(Array.isArray(response.body.details)).toBe(true)
      expect(response.body.details.length).toBeGreaterThan(0)
      expect(response.body.details[0]).toEqual({ path: 'name', message: expect.any(String) })
    })
  })

  describe('GET /catalog/products/:id/seasonal', () => {
    /**
     * Out-of-season domain code.
     *
     * The deterministic seed puts every fifth product in the `seasonal`
     * category (`p-000005` at index 4); looking it up here always rejects
     * with the explicit domain code `CATALOG_OUT_OF_SEASON`, never a
     * `BYMAX_*` code, proving the passthrough end to end.
     */
    it('rejects a seasonal product with the explicit CATALOG_OUT_OF_SEASON code', async () => {
      const response = await httpAgent(app).get('/catalog/products/p-000005/seasonal')

      expect(response.status).toBe(409)
      expect(response.body).toMatchObject({
        statusCode: 409,
        code: 'CATALOG_OUT_OF_SEASON',
        message: 'Product p-000005 is currently out of season',
      })
    })

    /** A non-seasonal product's seasonal lookup succeeds like a normal lookup. */
    it('returns a non-seasonal product normally', async () => {
      const response = await httpAgent(app).get('/catalog/products/p-000001/seasonal')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({ id: 'p-000001', category: 'electronics' })
    })
  })
})
