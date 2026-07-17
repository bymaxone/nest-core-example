/**
 * @fileoverview Production-mode collapse E2E (Feature-Coverage matrix row
 * 16-17). Boots the real, full `AppModule` with `NODE_ENV=production`, the
 * same env `buildCoreOptions` inspects to hard-force `exposeInternals` to
 * `false` regardless of `ENVELOPE_EXPOSE_INTERNALS`. Proves no internal
 * message, marker, or stack ever leaks from an unknown-error collapse in
 * production, while ordinary catalogued errors still work normally.
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import type { INestApplication } from '@nestjs/common'

import { UNKNOWN_FAILURE_MARKER } from '../../src/failures/failure-registry.js'
import { createTestingApp } from '../helpers/create-testing-app.js'
import { httpAgent } from '../helpers/http.js'

describe('production-mode collapse (real AppModule, NODE_ENV=production)', () => {
  let app: INestApplication

  beforeAll(async () => {
    // ENVELOPE_EXPOSE_INTERNALS stays 'true' deliberately: buildCoreOptions
    // must still force exposeInternals to false in production regardless of
    // this flag, proving the hardening is not just "the default is off".
    ;({ app } = await createTestingApp({
      NODE_ENV: 'production',
      ENVELOPE_EXPOSE_INTERNALS: 'true',
    }))
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * No internals leak from the unknown-error collapse.
   *
   * The response carries the fixed message and code only: no `details` key,
   * no occurrence of the deterministic marker embedded in the original
   * thrown error, and no stack trace anywhere in the body.
   */
  it('POST /failures/unknown collapses with no marker, no stack, and no details', async () => {
    const response = await httpAgent(app).post('/failures/unknown')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      statusCode: 500,
      code: 'BYMAX_INTERNAL_ERROR',
      message: 'Internal server error',
      timestamp: expect.any(String),
      path: '/failures/unknown',
      correlationId: expect.any(String),
    })
    const serialized = JSON.stringify(response.body)
    expect(serialized).not.toContain(UNKNOWN_FAILURE_MARKER)
    expect(serialized).not.toContain('.ts:')
    expect(serialized).not.toContain('at ')
  })

  /**
   * Catalogued errors are unaffected by the prod hardening.
   *
   * A standard `HttpException` derivation still maps normally in production;
   * only the unknown-error collapse is hardened, not the whole envelope.
   */
  it('POST /failures/conflict still maps normally in production', async () => {
    const response = await httpAgent(app).post('/failures/conflict')

    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({
      code: 'BYMAX_CONFLICT',
      message: 'Demo conflict failure',
    })
  })
})
