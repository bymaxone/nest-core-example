/**
 * Integration tests for FailuresController.
 *
 * Layer: integration (real Nest testing module, library filter wired as
 * production).
 * Goal: verify every registered failure kind produces the exact
 * `(code, statusCode)` pair documented in the library's BYMAX_* error-code
 * catalog, including the unmapped-4xx and unmapped-5xx fallbacks, and that an
 * unregistered kind 404s instead of executing anything. The unknown-throw
 * collapse gets its own dedicated prod/dev suites (prod-collapse.spec.ts,
 * dev-internals.spec.ts) since it needs two contrasting module configurations.
 * Mocks: none; boots a real testing module with `BymaxCoreModule.forRoot()`.
 */

import type { Server } from 'node:http'

import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { BymaxCoreModule } from '@bymax-one/nest-core'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'

import { FailuresModule } from './failures.module.js'

/** One row per `HttpException`-derived catalog code covered by this suite. */
interface CatalogRow {
  readonly kind: string
  readonly status: number
  readonly code: string
  /** The exact human-readable message the envelope must carry for this trigger. */
  readonly message: string
}

const CATALOG_ROWS: readonly CatalogRow[] = [
  {
    kind: 'bad-request',
    status: 400,
    code: 'BYMAX_BAD_REQUEST',
    message: 'Demo bad request failure',
  },
  {
    kind: 'unauthorized',
    status: 401,
    code: 'BYMAX_UNAUTHORIZED',
    message: 'Demo unauthorized failure',
  },
  { kind: 'forbidden', status: 403, code: 'BYMAX_FORBIDDEN', message: 'Demo forbidden failure' },
  { kind: 'conflict', status: 409, code: 'BYMAX_CONFLICT', message: 'Demo conflict failure' },
  {
    kind: 'payload-too-large',
    status: 413,
    code: 'BYMAX_PAYLOAD_TOO_LARGE',
    message: 'Demo payload too large failure',
  },
  {
    kind: 'unsupported-media-type',
    status: 415,
    code: 'BYMAX_UNSUPPORTED_MEDIA_TYPE',
    message: 'Demo unsupported media type failure',
  },
  {
    kind: 'unprocessable',
    status: 422,
    code: 'BYMAX_UNPROCESSABLE_ENTITY',
    message: 'Demo unprocessable entity failure',
  },
  {
    kind: 'too-many-requests',
    status: 429,
    code: 'BYMAX_TOO_MANY_REQUESTS',
    message: 'Demo too many requests failure',
  },
  {
    kind: 'internal',
    status: 500,
    code: 'BYMAX_INTERNAL_ERROR',
    message: 'Demo internal server error failure',
  },
  {
    kind: 'not-implemented',
    status: 501,
    code: 'BYMAX_NOT_IMPLEMENTED',
    message: 'Demo not implemented failure',
  },
  {
    kind: 'bad-gateway',
    status: 502,
    code: 'BYMAX_BAD_GATEWAY',
    message: 'Demo bad gateway failure',
  },
  {
    kind: 'service-unavailable',
    status: 503,
    code: 'BYMAX_SERVICE_UNAVAILABLE',
    message: 'Demo service unavailable failure',
  },
  {
    kind: 'gateway-timeout',
    status: 504,
    code: 'BYMAX_GATEWAY_TIMEOUT',
    message: 'Demo gateway timeout failure',
  },
  // Unmapped 4xx: the filter derives the generic BYMAX_CLIENT_ERROR fallback
  // from the raw 418 status rather than a dedicated catalog row.
  { kind: 'teapot', status: 418, code: 'BYMAX_CLIENT_ERROR', message: 'I am a teapot' },
  // Unmapped 5xx: any status outside the catalogued rows collapses to
  // BYMAX_INTERNAL_ERROR, the same code the unknown-throw collapse uses.
  {
    kind: 'variant-5xx',
    status: 507,
    code: 'BYMAX_INTERNAL_ERROR',
    message: 'Insufficient storage',
  },
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
   * Full catalog of `HttpException`-derived codes, one row per registered
   * failure kind.
   *
   * Every `POST /failures/:kind` in this table must produce the exact
   * `(code, statusCode)` pair the library's exception filter derives: the
   * standard per-status codes, and the unmapped-4xx / unmapped-5xx fallbacks.
   */
  it.each(CATALOG_ROWS)(
    'POST /failures/$kind -> $status $code',
    async ({ kind, status, code, message }) => {
      const response = await request(httpServer).post(`/failures/${kind}`)

      expect(response.status).toBe(status)
      const body = response.body as { code: string; message: string }
      expect(body.code).toBe(code)
      // Pin the exact human-readable message the trigger raises so the
      // demo copy in the failure registry cannot drift or be emptied.
      expect(body.message).toBe(message)
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
    const body = response.body as { code: string; message: string }
    expect(body.code).toBe('BYMAX_NOT_FOUND')
    // The 404 names the rejected kind, so the guard's message cannot be emptied.
    expect(body.message).toBe('Unknown failure kind: does-not-exist')
  })
})
