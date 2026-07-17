/**
 * @fileoverview Synchronous `BymaxCoreModule.forRoot` registration E2E
 * (Feature-Coverage matrix row 2). The application itself wires the module
 * with `forRootAsync`; this spec boots a dedicated testing module using the
 * synchronous `forRoot` overload with its documented defaults, then asserts
 * the same envelope and health parity the async app demonstrates elsewhere
 * in this suite, so the sync path is proven as a first-class registration
 * route rather than only ever exercised implicitly through async wiring.
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { BymaxCoreModule } from '@bymax-one/nest-core'

import { httpAgent } from '../helpers/http.js'

/** A module registering the library with no options: every documented default applies. */
@Module({ imports: [BymaxCoreModule.forRoot()] })
class SyncRootModule {}

describe('BymaxCoreModule.forRoot (sync registration path)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SyncRootModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  /** Health is enabled by default and registered at the default `health` prefix. */
  it('GET /health/live returns ok with an empty checks array', async () => {
    const response = await httpAgent(app).get('/health/live')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', checks: [] })
  })

  /** With no indicators bound, readiness is vacuously ok. */
  it('GET /health/ready returns ok when no indicators are bound', async () => {
    const response = await httpAgent(app).get('/health/ready')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', checks: [] })
  })

  /**
   * Envelope parity with the async app.
   *
   * An unmatched route produces the same pinned 7-field-contract shape (minus
   * `correlationId`, since this bare module binds no correlation provider) as
   * the full `AppModule`'s async registration.
   */
  it('GET /unregistered returns the pinned BYMAX_NOT_FOUND envelope', async () => {
    const response = await httpAgent(app).get('/unregistered')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      statusCode: 404,
      code: 'BYMAX_NOT_FOUND',
      message: 'Cannot GET /unregistered',
      timestamp: expect.any(String),
      path: '/unregistered',
    })
  })

  /** Metrics stay off by default; no route is registered for it. */
  it('GET /metrics is not registered (metrics default off)', async () => {
    const response = await httpAgent(app).get('/metrics')

    expect(response.status).toBe(404)
  })
})
