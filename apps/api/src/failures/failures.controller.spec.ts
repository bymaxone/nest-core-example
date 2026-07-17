/**
 * Integration tests for FailuresController.
 *
 * Layer: integration (real Nest testing module, library filter wired as
 * production).
 * Goal: verify every registered failure kind produces the exact
 * `(code, statusCode)` pair documented in the library's BYMAX_* error-code
 * catalog, and that an unregistered kind 404s instead of executing anything.
 * Mocks: none; boots a real testing module with `BymaxCoreModule.forRoot()`.
 */

import type { Server } from 'node:http'

import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { BymaxCoreModule } from '@bymax-one/nest-core'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'

import { FailuresModule } from './failures.module.js'

/** One row per standard `HttpException` derivation covered by this suite. */
interface CatalogRow {
  readonly kind: string
  readonly status: number
  readonly code: string
}

const STANDARD_CATALOG_ROWS: readonly CatalogRow[] = [
  { kind: 'bad-request', status: 400, code: 'BYMAX_BAD_REQUEST' },
  { kind: 'unauthorized', status: 401, code: 'BYMAX_UNAUTHORIZED' },
  { kind: 'forbidden', status: 403, code: 'BYMAX_FORBIDDEN' },
  { kind: 'conflict', status: 409, code: 'BYMAX_CONFLICT' },
  { kind: 'payload-too-large', status: 413, code: 'BYMAX_PAYLOAD_TOO_LARGE' },
  { kind: 'unsupported-media-type', status: 415, code: 'BYMAX_UNSUPPORTED_MEDIA_TYPE' },
  { kind: 'unprocessable', status: 422, code: 'BYMAX_UNPROCESSABLE_ENTITY' },
  { kind: 'too-many-requests', status: 429, code: 'BYMAX_TOO_MANY_REQUESTS' },
  { kind: 'internal', status: 500, code: 'BYMAX_INTERNAL_ERROR' },
  { kind: 'not-implemented', status: 501, code: 'BYMAX_NOT_IMPLEMENTED' },
  { kind: 'bad-gateway', status: 502, code: 'BYMAX_BAD_GATEWAY' },
  { kind: 'service-unavailable', status: 503, code: 'BYMAX_SERVICE_UNAVAILABLE' },
  { kind: 'gateway-timeout', status: 504, code: 'BYMAX_GATEWAY_TIMEOUT' },
]

describe('FailuresController', () => {
  let app: INestApplication
  let httpServer: Server

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BymaxCoreModule.forRoot(), FailuresModule],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    // `getHttpServer()` is typed `any`; the runtime value is the underlying
    // Node HTTP server supertest needs, so cast it once here.
    httpServer = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * Full standard-derivation catalog, one row per registered failure kind.
   *
   * Every `POST /failures/:kind` in this table must produce the exact
   * `(code, statusCode)` pair the library's exception filter derives from the
   * matching `HttpException` subclass.
   */
  it.each(STANDARD_CATALOG_ROWS)(
    'POST /failures/$kind -> $status $code',
    async ({ kind, status, code }) => {
      const response = await request(httpServer).post(`/failures/${kind}`)

      expect(response.status).toBe(status)
      expect((response.body as { code: string }).code).toBe(code)
    },
  )

  /**
   * Unknown kind rejection.
   *
   * A kind absent from the registry must 404 with BYMAX_NOT_FOUND rather than
   * executing anything, keeping the trigger surface closed to arbitrary
   * input.
   */
  it('rejects an unregistered kind with BYMAX_NOT_FOUND', async () => {
    const response = await request(httpServer).post('/failures/does-not-exist')

    expect(response.status).toBe(404)
    expect((response.body as { code: string }).code).toBe('BYMAX_NOT_FOUND')
  })
})
