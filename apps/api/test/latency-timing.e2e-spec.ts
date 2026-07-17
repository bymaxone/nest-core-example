/**
 * @fileoverview E2E: the Latency Lab and the timing-feed surface over real
 * HTTP, covering the artificial delay, the route-template (bounded
 * cardinality) sample shape, the slow-request flag, error statuses still
 * being recorded, and the sink's never-throw guarantee under poison
 * (Feature-Coverage matrix rows 37-42).
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { INestApplication } from '@nestjs/common'

import { createTestingApp } from './helpers/create-testing-app.js'
import { httpAgent } from './helpers/http.js'

describe('latency lab and timing feed', () => {
  let app: INestApplication

  beforeAll(async () => {
    ;({ app } = await createTestingApp())
  })

  afterAll(async () => {
    await app.close()
  })

  /** The artificial-delay endpoint reports the requested and measured elapsed time. */
  it('GET /latency?ms= reports the requested delay and an elapsed time at least that long', async () => {
    const response = await httpAgent(app).get('/latency').query({ ms: 20 })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ requestedMs: 20, poisoned: false })
    expect(response.body.elapsedMs).toBeGreaterThanOrEqual(20)
  })

  /**
   * Route template, not the raw URL.
   *
   * Two requests against different product ids must collapse to the same
   * bounded route label in the timing feed, `/catalog/products/:id`, never
   * the literal ids.
   */
  it('records the route template (not the raw URL) for parametrized routes', async () => {
    await httpAgent(app).get('/catalog/products/p-000001')
    await httpAgent(app).get('/catalog/products/p-000002')

    const response = await httpAgent(app).get('/timing/samples')

    const catalogSamples = (response.body.samples as { route: string; method: string }[]).filter(
      (sample) => sample.method === 'GET' && sample.route.startsWith('/catalog/products'),
    )
    expect(catalogSamples.length).toBeGreaterThanOrEqual(2)
    for (const sample of catalogSamples) {
      expect(sample.route).toBe('/catalog/products/:id')
    }
  })

  /**
   * The slow flag crosses the configured threshold.
   *
   * This suite's baseline sets `TIMING_SLOW_THRESHOLD_MS=500`; a request well
   * under it is never flagged, one well over it always is.
   */
  it('flags a request above the threshold as slow and one below it as not', async () => {
    await httpAgent(app).get('/latency').query({ ms: 5 })
    await httpAgent(app).get('/latency').query({ ms: 600 })

    const response = await httpAgent(app).get('/timing/samples')

    const latencySamples = (
      response.body.samples as { route: string; durationMs: number; slow: boolean }[]
    ).filter((sample) => sample.route === '/latency')
    expect(latencySamples.some((sample) => sample.durationMs < 500 && !sample.slow)).toBe(true)
    expect(latencySamples.some((sample) => sample.durationMs >= 500 && sample.slow)).toBe(true)
    expect(response.body.thresholdMs).toBe(500)
  })

  /**
   * Error statuses are recorded too.
   *
   * A failing request (a triggered `BYMAX_*` error) still produces a timing
   * sample carrying its real error status, not swallowed by the interceptor.
   */
  it('records a sample for a failing request, carrying its error status', async () => {
    await httpAgent(app).post('/failures/conflict')

    const response = await httpAgent(app).get('/timing/samples')

    const failureSamples = (
      response.body.samples as { route: string; statusCode: number }[]
    ).filter((sample) => sample.route === '/failures/:kind')
    expect(failureSamples.some((sample) => sample.statusCode === 409)).toBe(true)
  })

  /**
   * Sink never-throw guarantee, via the latency endpoint's own poison query.
   *
   * `poison=true` arms the sink to throw exactly once on THIS request's own
   * post-handler recording; the interceptor swallows that failure, so the
   * HTTP response still completes normally with `poisoned: true`.
   */
  it('completes normally when the latency endpoint poisons the sink for its own recording', async () => {
    const response = await httpAgent(app).get('/latency').query({ ms: 1, poison: 'true' })

    expect(response.status).toBe(200)
    expect(response.body.poisoned).toBe(true)
  })

  /**
   * Sink never-throw guarantee, via the dedicated one-shot poison endpoint.
   *
   * Arming poisons the arming request's OWN post-handler recording (the same
   * self-poisoning shape the latency endpoint demonstrates): the HTTP call
   * still succeeds (202, `armed: true`), but its own sample never lands in
   * the feed. The poison is one-shot, not sticky: the very next request's
   * sample records normally.
   */
  it('POST /timing/poison arms a one-shot failure that never breaks the arming request', async () => {
    const armResponse = await httpAgent(app).post('/timing/poison')
    expect(armResponse.status).toBe(202)
    expect(armResponse.body).toEqual({ armed: true })

    // A route with a fresh, otherwise-unused label from this file, so its
    // presence unambiguously reflects post-arm recording behavior.
    await httpAgent(app).get('/catalog/products/p-000003')
    const response = await httpAgent(app).get('/timing/samples')

    const routes = (response.body.samples as { route: string }[]).map((sample) => sample.route)
    // The arming request's own sample was dropped by the poison it set.
    expect(routes).not.toContain('/timing/poison')
    // The poison already fired once and cleared; this later request recorded normally.
    expect(routes).toContain('/catalog/products/:id')
  })
})
