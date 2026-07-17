/**
 * Integration tests for the unknown-throw development contrast.
 *
 * Layer: integration (real Nest testing module, `exposeInternals: true`, the
 * development posture).
 * Goal: verify that with internals exposed, the unknown throw's original
 * message and stack surface under `details`, while the top-level `message`
 * stays the same safe, fixed string as in production.
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

describe('Failures: unknown-throw development contrast', () => {
  let app: INestApplication
  let httpServer: Server

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BymaxCoreModule.forRoot({ envelope: { exposeInternals: true } }), FailuresModule],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    httpServer = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * Development-only internal detail.
   *
   * With `exposeInternals` on, the collapsed envelope must still report the
   * fixed, safe top-level `message`, but its `details` must carry the
   * original marker message and a stack, proving the dev/prod contrast the
   * Error Envelope Playground demonstrates side by side.
   */
  it('exposes the original message and stack under details', async () => {
    const response = await request(httpServer).post('/failures/unknown')

    expect(response.status).toBe(500)
    const body = response.body as {
      code: string
      message: string
      details?: Record<string, unknown>
    }
    expect(body.code).toBe('BYMAX_INTERNAL_ERROR')
    expect(body.message).toBe('Internal server error')
    expect(body.details?.['message']).toBe(UNKNOWN_FAILURE_MARKER)
    expect(typeof body.details?.['stack']).toBe('string')
  })
})
