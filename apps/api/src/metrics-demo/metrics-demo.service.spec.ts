/**
 * Unit tests for MetricsDemoService.
 *
 * Layer: unit.
 * Goal: verify the counter is created against the injected registry on first
 * use, cached for later increments, and reused when the registry already holds
 * a counter of that name.
 * Mocks: none; a real, isolated prom-client Registry per test (loaded lazily,
 * never statically imported).
 */

import { beforeEach, describe, expect, it } from '@jest/globals'

import { MetricsDemoService } from './metrics-demo.service.js'

describe('MetricsDemoService', () => {
  let promClient: typeof import('prom-client')

  beforeEach(async () => {
    promClient = await import('prom-client')
  })

  /**
   * Create, increment, and cache.
   *
   * The first lookup must create and increment the counter (total 1); a second
   * lookup on the same service must reuse the cached counter (total 2), and the
   * counter must be discoverable on the injected registry.
   */
  it('creates the counter on first lookup and caches it for later increments', async () => {
    const registry = new promClient.Registry()
    const service = new MetricsDemoService(registry)

    const first = await service.recordLookup()
    const second = await service.recordLookup()

    expect(first).toEqual({ metric: 'catalog_lookups_total', total: 1 })
    expect(second.total).toBe(2)
    expect(registry.getSingleMetric('catalog_lookups_total')).toBeDefined()
  })

  /**
   * Reuse an existing registered counter.
   *
   * When the registry already carries a counter of the same name, the service
   * must increment that same counter rather than register a duplicate (which
   * prom-client would reject), proving the get-or-create path.
   */
  it('reuses a counter already registered on the injected registry', async () => {
    const registry = new promClient.Registry()
    const seeded = new promClient.Counter({
      name: 'catalog_lookups_total',
      help: 'preexisting',
      registers: [registry],
    })
    const service = new MetricsDemoService(registry)

    const result = await service.recordLookup()

    expect(result.total).toBe(1)
    const snapshot = await seeded.get()
    expect(snapshot.values.reduce((sum, entry) => sum + entry.value, 0)).toBe(1)
  })
})
