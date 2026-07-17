/**
 * Integration tests for the unknown-throw production collapse.
 *
 * Layer: integration (real Nest testing module, `exposeInternals: false`,
 * the production posture).
 * Goal: verify that an unmapped `Error` collapses to the fixed, safe 500
 * envelope with no leaked marker, message, or stack when the library is
 * configured exactly as it would be in production.
 * Mocks: none; boots a real testing module with `BymaxCoreModule.forRoot()`.
 */

import type { Server } from 'node:http'

import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { BymaxCoreModule } from '@bymax-one/nest-core'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'

import { FailuresModule } from './failures.module.js'
import { UNKNOWN_FAILURE_MARKER } from './failure-registry.js'

describe('Failures: unknown-throw production collapse', () => {
  let app: INestApplication
  let httpServer: Server

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BymaxCoreModule.forRoot({ envelope: { exposeInternals: false } }), FailuresModule],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    httpServer = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * Production-safe collapse.
   *
   * With `exposeInternals` off, the unknown thrown `Error` must collapse to
   * the fixed 500 envelope: the exact documented fields, no `details` key at
   * all, and no trace of the original message or a stack anywhere in the body.
   */
  it('collapses the unknown throw with no internal detail leaked', async () => {
    const response = await request(httpServer).post('/failures/unknown')

    expect(response.status).toBe(500)
    const body = response.body as Record<string, unknown>
    expect(body['code']).toBe('BYMAX_INTERNAL_ERROR')
    expect(body['message']).toBe('Internal server error')
    expect(body).not.toHaveProperty('details')
    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain(UNKNOWN_FAILURE_MARKER)
    expect(serialized.toLowerCase()).not.toContain('stack')
  })
})
