/**
 * @fileoverview Custom `health.path` and `metrics.path` E2E (Feature-Coverage
 * matrix rows 59, 68). Route metadata is fixed at module-definition time, so
 * a custom prefix is only honored through the synchronous `forRoot`
 * overload (per the library's README); this spec proves both custom
 * prefixes serve at once on a dedicated sync-registered module.
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { BymaxCoreModule } from '@bymax-one/nest-core'

import { httpAgent } from '../helpers/http.js'

/** Health mounted under `status/`, metrics enabled and mounted under `telemetry`. */
@Module({
  imports: [
    BymaxCoreModule.forRoot({
      health: { path: 'status' },
      metrics: { enabled: true, path: 'telemetry' },
    }),
  ],
})
class CustomPathsModule {}

describe('custom health.path and metrics.path (sync registration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [CustomPathsModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  /** The custom health prefix serves liveness at its configured path. */
  it('GET /status/live serves at the custom health prefix', async () => {
    const response = await httpAgent(app).get('/status/live')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', checks: [] })
  })

  /** The custom health prefix serves readiness at its configured path. */
  it('GET /status/ready serves at the custom health prefix', async () => {
    const response = await httpAgent(app).get('/status/ready')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', checks: [] })
  })

  /** The default health prefix is not mounted once a custom one is configured. */
  it('GET /health/live is not registered once the health path is customized', async () => {
    const response = await httpAgent(app).get('/health/live')

    expect(response.status).toBe(404)
  })

  /** The custom metrics route serves the Prometheus scrape. */
  it('GET /telemetry serves the Prometheus scrape at the custom metrics path', async () => {
    const response = await httpAgent(app).get('/telemetry')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
  })

  /** The default metrics route is not mounted once a custom one is configured. */
  it('GET /metrics is not registered once the metrics path is customized', async () => {
    const response = await httpAgent(app).get('/metrics')

    expect(response.status).toBe(404)
  })
})
