/**
 * @fileoverview Deterministic in-memory repository backing the demo product
 * catalog. Seeds `CATALOG_SEED_COUNT` products from a per-index seeded PRNG
 * (never `Math.random`), so a fresh boot with the same env always serves the
 * exact same catalog. Every read simulates `CATALOG_ORIGIN_LATENCY_MS` of
 * origin latency so request timing has something real to show. The library's
 * pagination helpers never touch persistence directly; this repository is the
 * seam that proves they are ORM-neutral.
 * @layer repository
 */

import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { PageQuery } from '@bymax-one/nest-core/pagination'

import type { Env } from '../config/env.schema.js'
import type { Product } from './product.types.js'

/** Ordering keys encoded into a cursor for this repository (id only). */
export interface ProductCursorKeys {
  readonly id: string
}

/** A slice of products plus the total count across the full catalog. */
export interface ProductPage {
  /** The requested rows, in catalog order. */
  readonly rows: Product[]
  /** Total number of products in the catalog. */
  readonly total: number
}

/** Deterministic category rotation; every fifth product lands on `'seasonal'`. */
const CATEGORIES = ['electronics', 'home', 'outdoors', 'office', 'seasonal'] as const

/** Adjective pool for deterministic name generation. */
const ADJECTIVES = [
  'Aurora',
  'Boreal',
  'Cobalt',
  'Driftwood',
  'Ember',
  'Frost',
  'Granite',
  'Harbor',
  'Indigo',
  'Juniper',
  'Kestrel',
  'Lumen',
  'Meridian',
  'Nimbus',
  'Onyx',
  'Pinewood',
] as const

/** Noun pool for deterministic name generation. */
const NOUNS = [
  'Backpack',
  'Beacon',
  'Canteen',
  'Compass',
  'Flask',
  'Journal',
  'Kettle',
  'Lantern',
  'Mug',
  'Notebook',
  'Parka',
  'Poncho',
  'Sandal',
  'Scarf',
  'Thermos',
  'Umbrella',
] as const

/** Fixed epoch so seeded `createdAt` values are stable across runs. */
const CATALOG_EPOCH_MS = Date.UTC(2024, 0, 1)

/** Milliseconds in one day, used to spread seeded `createdAt` values. */
const ONE_DAY_MS = 86_400_000

/**
 * Deterministic PRNG seeded per index (mulberry32 algorithm). Never
 * `Math.random`: the same seed always yields the same stream, independent of
 * generation order, so any single product can be rebuilt in isolation.
 *
 * @param seed - Integer seed, unique per product index.
 * @returns A generator function producing floats in `[0, 1)`.
 */
function mulberry32(seed: number): () => number {
  let state = seed
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Pick one deterministic element from a fixed, non-empty pool.
 *
 * @param items - The non-empty pool to pick from (one of the module constants).
 * @param random - The seeded PRNG stream to draw the index from.
 * @returns One element of `items`.
 */
function pickFrom<T>(items: readonly T[], random: () => number): T {
  const index = Math.floor(random() * items.length) % items.length
  // `items` is always a fixed, non-empty module constant and `index` is always
  // within its bounds, so this lookup can never be undefined.
  return items[index]!
}

/**
 * Build the single deterministic product for a seed index.
 *
 * @param index - Zero-based position in the seed sequence.
 * @returns The product generated purely from `index`.
 */
function buildSeedProduct(index: number): Product {
  const random = mulberry32(index + 1)
  const adjective = pickFrom(ADJECTIVES, random)
  const noun = pickFrom(NOUNS, random)
  const priceCents = 500 + Math.floor(random() * 49_500)
  return {
    id: `p-${String(index + 1).padStart(6, '0')}`,
    name: `${adjective} ${noun}`,
    category: CATEGORIES[index % CATEGORIES.length]!,
    priceCents,
    createdAt: new Date(CATALOG_EPOCH_MS + index * ONE_DAY_MS).toISOString(),
  }
}

/**
 * Deterministic, latency-simulated in-memory product repository.
 *
 * The seed is generated once per instance from `CATALOG_SEED_COUNT`.
 */
@Injectable()
export class ProductRepository {
  private readonly products: Product[]
  private readonly originLatencyMs: number

  /**
   * @param config - Typed config service supplying the seed count and the
   *   artificial origin latency.
   */
  constructor(@Inject(ConfigService) config: ConfigService<Env, true>) {
    const seedCount = config.get('CATALOG_SEED_COUNT', { infer: true })
    this.originLatencyMs = config.get('CATALOG_ORIGIN_LATENCY_MS', { infer: true })
    this.products = Array.from({ length: seedCount }, (_value, index) => buildSeedProduct(index))
  }

  /**
   * Find a single product by id.
   *
   * @param id - The product id to look up.
   * @returns The matching product, or `undefined` when no product has that id.
   */
  async findById(id: string): Promise<Product | undefined> {
    await this.simulateLatency()
    return this.products.find((product) => product.id === id)
  }

  /**
   * Fetch one offset-paginated slice of the catalog.
   *
   * @param query - The clamped offset query from `normalizePageQuery`.
   * @returns The requested rows and the total item count.
   */
  async findPage(query: PageQuery): Promise<ProductPage> {
    await this.simulateLatency()
    const start = (query.page - 1) * query.limit
    return { rows: this.products.slice(start, start + query.limit), total: this.products.length }
  }

  /**
   * Fetch rows strictly after a cursor position, ordered by id.
   *
   * Implements the fetch-one-extra convention: the caller passes `limit + 1`
   * so it can detect whether another page follows. An absent cursor starts
   * from the beginning of the catalog; a cursor whose id is no longer present
   * is treated the same way, restarting the walk rather than failing, since
   * catalog ids are public and never sensitive.
   *
   * @param after - Ordering keys decoded from the client's cursor, or
   *   `undefined` for the first page.
   * @param limit - Number of rows to fetch (typically the requested limit + 1).
   * @returns Up to `limit` rows ordered by id, starting after the cursor position.
   */
  async findAfter(after: ProductCursorKeys | undefined, limit: number): Promise<Product[]> {
    await this.simulateLatency()
    const afterIndex = after ? this.products.findIndex((product) => product.id === after.id) : -1
    return this.products.slice(afterIndex + 1, afterIndex + 1 + limit)
  }

  /** Await the configured artificial origin latency. */
  private async simulateLatency(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, this.originLatencyMs))
  }
}
