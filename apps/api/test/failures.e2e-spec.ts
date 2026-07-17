/**
 * @fileoverview E2E: every failure-injection trigger over real HTTP, proving
 * each row of the library's `BYMAX_*` error-code catalog is reproducible on
 * demand, plus the unknown-kind 404 and the dev-mode internals-exposure
 * proof for the unknown-throw collapse (Feature-Coverage matrix rows 16-17,
 * 20-36).
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { INestApplication } from '@nestjs/common'

import { UNKNOWN_FAILURE_MARKER } from '../src/failures/failure-registry.js'
import { createTestingApp } from './helpers/create-testing-app.js'
import { httpAgent } from './helpers/http.js'

/** Every registered failure kind paired with its documented status and code. */
const FAILURE_CASES: ReadonlyArray<readonly [kind: string, status: number, code: string]> = [
  ['bad-request', 400, 'BYMAX_BAD_REQUEST'],
  ['unauthorized', 401, 'BYMAX_UNAUTHORIZED'],
  ['forbidden', 403, 'BYMAX_FORBIDDEN'],
  ['conflict', 409, 'BYMAX_CONFLICT'],
  ['payload-too-large', 413, 'BYMAX_PAYLOAD_TOO_LARGE'],
  ['unsupported-media-type', 415, 'BYMAX_UNSUPPORTED_MEDIA_TYPE'],
  ['unprocessable', 422, 'BYMAX_UNPROCESSABLE_ENTITY'],
  ['too-many-requests', 429, 'BYMAX_TOO_MANY_REQUESTS'],
  ['internal', 500, 'BYMAX_INTERNAL_ERROR'],
  ['not-implemented', 501, 'BYMAX_NOT_IMPLEMENTED'],
  ['bad-gateway', 502, 'BYMAX_BAD_GATEWAY'],
  ['service-unavailable', 503, 'BYMAX_SERVICE_UNAVAILABLE'],
  ['gateway-timeout', 504, 'BYMAX_GATEWAY_TIMEOUT'],
  // Unmapped statuses: the filter derives the fallback code rather than a
  // catalogued one, one row for the 4xx family and one for 5xx.
  ['teapot', 418, 'BYMAX_CLIENT_ERROR'],
  ['variant-5xx', 507, 'BYMAX_INTERNAL_ERROR'],
]

describe('failure injection', () => {
  let app: INestApplication

  beforeAll(async () => {
    ;({ app } = await createTestingApp())
  })

  afterAll(async () => {
    await app.close()
  })

  describe.each(FAILURE_CASES)('POST /failures/%s', (kind, status, code) => {
    /**
     * Full catalog derivation.
     *
     * Every registered failure kind must reproduce its documented status and
     * `BYMAX_*` code exactly, one assertion per row of the error-code catalog.
     */
    it(`returns ${status} with code ${code}`, async () => {
      const response = await httpAgent(app).post(`/failures/${kind}`)

      expect(response.status).toBe(status)
      expect(response.body.code).toBe(code)
      expect(response.body.statusCode).toBe(status)
    })
  })

  /**
   * Unrecognized kind: 404, not a registered trigger.
   *
   * An unknown route parameter never executes a trigger; it collapses to the
   * same `BYMAX_NOT_FOUND` path as any other unmatched lookup.
   */
  it('POST /failures/does-not-exist returns BYMAX_NOT_FOUND', async () => {
    const response = await httpAgent(app).post('/failures/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ code: 'BYMAX_NOT_FOUND' })
  })

  describe('POST /failures/unknown (non-HttpException collapse)', () => {
    /**
     * Dev-mode internals exposure.
     *
     * This suite's baseline env sets `ENVELOPE_EXPOSE_INTERNALS=true` outside
     * production, so the collapsed 500 still carries the original message
     * (including the deterministic marker) and a stack in `details`: the
     * contrast case for the prod-collapse variant, which proves the opposite.
     */
    it('exposes the original message and stack in details outside production', async () => {
      const response = await httpAgent(app).post('/failures/unknown')

      expect(response.status).toBe(500)
      expect(response.body).toMatchObject({
        code: 'BYMAX_INTERNAL_ERROR',
        message: 'Internal server error',
      })
      expect(response.body.details.message).toContain(UNKNOWN_FAILURE_MARKER)
      expect(response.body.details.stack).toEqual(expect.any(String))
    })
  })
})
