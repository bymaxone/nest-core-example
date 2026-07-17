/**
 * @fileoverview E2E: the Prometheus scrape endpoint and the custom
 * application counter over real HTTP, covering the default HTTP metrics
 * bridge, default labels, process metrics, and a custom metric registered
 * against the injected registry (Feature-Coverage matrix rows 63-70).
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { INestApplication } from '@nestjs/common'

import { createTestingApp } from './helpers/create-testing-app.js'
import { httpAgent } from './helpers/http.js'

describe('metrics', () => {
  let app: INestApplication

  beforeAll(async () => {
    ;({ app } = await createTestingApp())
    // Seed at least one timed request so the default HTTP metrics bridge has
    // something to report before the scrape below.
    await httpAgent(app).get('/')
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * The full default scrape surface.
   *
   * A single `GET /metrics` must expose the default HTTP counter and
   * histogram (fed by the timing bridge), the configured default label, and
   * the opted-in process metrics, all in Prometheus text format.
   */
  it('GET /metrics serves default HTTP metrics, default labels, and process metrics', async () => {
    const response = await httpAgent(app).get('/metrics')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.text).toContain('http_requests_total')
    expect(response.text).toContain('http_request_duration_seconds')
    expect(response.text).toContain('app="nest-core-example"')
    expect(response.text).toContain('process_cpu_seconds_total')
  })

  /**
   * Bounded route labels.
   *
   * Two requests against different product ids must collapse to one
   * `route="/catalog/products/:id"` series rather than a label per id, the
   * same bounded-cardinality guarantee the timing feed demonstrates.
   */
  it('collapses varied ids into one bounded route label', async () => {
    await httpAgent(app).get('/catalog/products/p-000001')
    await httpAgent(app).get('/catalog/products/p-000002')

    const response = await httpAgent(app).get('/metrics')

    expect(response.text).toContain('route="/catalog/products/:id"')
    expect(response.text).not.toContain('route="/catalog/products/p-000001"')
  })

  describe('POST /metrics-demo/lookup (custom application counter)', () => {
    /**
     * A custom counter registered against the injected registry.
     *
     * Each call increments `catalog_lookups_total` and reports the running
     * total; the same counter must then be visible on the scrape endpoint,
     * proving `BYMAX_METRICS_REGISTRY` is shared between the demo module and
     * the library's own endpoint.
     */
    it('increments the counter across calls and surfaces it on the scrape', async () => {
      const first = await httpAgent(app).post('/metrics-demo/lookup')
      expect(first.status).toBe(201)
      expect(first.body.metric).toBe('catalog_lookups_total')
      const firstTotal = first.body.total as number

      const second = await httpAgent(app).post('/metrics-demo/lookup')
      expect(second.body.total).toBe(firstTotal + 1)

      const scrape = await httpAgent(app).get('/metrics')
      expect(scrape.text).toContain('catalog_lookups_total')
    })
  })
})
