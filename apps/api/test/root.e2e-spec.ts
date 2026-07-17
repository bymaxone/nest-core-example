/**
 * @fileoverview E2E: root service descriptor, the CI-probe route, and the
 * pinned error-envelope contract on an unmatched route (Feature-Coverage
 * matrix rows 12, 18-19).
 * @layer test
 */

import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { INestApplication } from '@nestjs/common'

import { createTestingApp } from './helpers/create-testing-app.js'
import { httpAgent } from './helpers/http.js'

describe('root and unmatched-route envelope', () => {
  let app: INestApplication

  beforeAll(async () => {
    ;({ app } = await createTestingApp())
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * Root descriptor over real HTTP.
   *
   * `GET /` must serve the service name and docs pointer through the actual
   * Express pipeline, matching the unit-level contract.
   */
  it('GET / returns the service descriptor', async () => {
    const response = await httpAgent(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      name: 'nest-core-example',
      docs: 'See the repository README for the full endpoint catalogue.',
    })
  })

  /**
   * CI-probe route.
   *
   * `GET /health` (distinct from the library's `/health/live` and
   * `/health/ready`) always answers 200, the target the shared pipeline's
   * boot-wait step polls before running the Playwright web smoke.
   */
  it('GET /health returns a constant ok status', async () => {
    const response = await httpAgent(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  /**
   * Pinned envelope shape and header pairing on an unmatched route.
   *
   * Every field of the documented 7-field contract is asserted exactly:
   * `statusCode`, `code`, `message`, `timestamp`, `path` always present,
   * `correlationId` present (the app binds `RequestContextService`), and it
   * equals the echoed `x-request-id` response header.
   */
  it('GET /nowhere-registered returns the pinned BYMAX_NOT_FOUND envelope with header pairing', async () => {
    const response = await httpAgent(app).get('/nowhere-registered')

    expect(response.status).toBe(404)
    const correlationId = response.headers['x-request-id'] as string
    expect(correlationId).toEqual(expect.any(String))
    expect(response.body).toEqual({
      statusCode: 404,
      code: 'BYMAX_NOT_FOUND',
      message: 'Cannot GET /nowhere-registered',
      timestamp: expect.any(String),
      path: '/nowhere-registered',
      correlationId,
    })
  })

  /**
   * Correlation id uniqueness.
   *
   * The middleware mints a fresh id per request (never trusting an inbound
   * header), so two requests, even one that supplies its own `x-request-id`,
   * receive distinct server-generated ids.
   */
  it('never trusts a client-supplied x-request-id header', async () => {
    const forged = randomUUID()

    const response = await httpAgent(app).get('/').set('x-request-id', forged)

    expect(response.headers['x-request-id']).not.toBe(forged)
  })
})
