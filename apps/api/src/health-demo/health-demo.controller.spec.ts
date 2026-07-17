/**
 * Integration tests for the health demo toggles and readiness aggregation.
 *
 * Layer: integration (real Nest testing module, real library health route,
 * driven through supertest).
 * Goal: prove readiness flips 200 to 503 and back with the flaky toggle, that a
 * single failing indicator hides none of the others, and that the armed hanging
 * indicator is reported down by timeout with its diagnostic detail.
 * Mocks: none; the three real indicators are wired exactly as in production.
 */

import type { Server } from 'node:http'

import { Global, Module } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { BYMAX_HEALTH_INDICATORS, BymaxCoreModule } from '@bymax-one/nest-core'
import type { HealthCheckEntry, HealthResponse } from '@bymax-one/nest-core/health'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'

import { collectHealthIndicators } from '../core/core.module.js'
import { EventLoopHealthIndicator } from './event-loop.indicator.js'
import { FlakyHealthIndicator } from './flaky.indicator.js'
import { FlakyStateService } from './flaky-state.service.js'
import { HangStateService } from './hang-state.service.js'
import { HangingHealthIndicator } from './hanging.indicator.js'
import { HealthDemoModule } from './health-demo.module.js'

/** Short per-indicator timeout so the armed hang proof stays fast. */
const INDICATOR_TIMEOUT_MS = 150

/**
 * Global test wiring: collects the three real indicators into the library's
 * array token, mirroring the production `CoreWiringModule` binding.
 */
@Global()
@Module({
  imports: [HealthDemoModule],
  providers: [
    EventLoopHealthIndicator,
    {
      provide: BYMAX_HEALTH_INDICATORS,
      useFactory: collectHealthIndicators,
      inject: [EventLoopHealthIndicator, FlakyHealthIndicator, HangingHealthIndicator],
    },
  ],
  exports: [BYMAX_HEALTH_INDICATORS],
})
class HealthWiringTestModule {}

/**
 * Find a named check in a readiness response, failing loudly when absent.
 *
 * @param body - The readiness response body.
 * @param name - The indicator name to locate.
 * @returns The matching check entry.
 */
function findCheck(body: HealthResponse, name: string): HealthCheckEntry {
  const check = body.checks.find((entry) => entry.name === name)
  if (check === undefined) {
    throw new Error(`Expected a "${name}" check in the readiness response`)
  }
  return check
}

describe('HealthDemoController readiness proofs', () => {
  let app: INestApplication
  let httpServer: Server
  let flakyState: FlakyStateService
  let hangState: HangStateService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        BymaxCoreModule.forRoot({
          health: { indicatorTimeoutMs: INDICATOR_TIMEOUT_MS },
          timing: { enabled: false },
          metrics: { enabled: false },
        }),
        HealthWiringTestModule,
      ],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    httpServer = app.getHttpServer() as Server
    flakyState = moduleRef.get(FlakyStateService, { strict: false })
    hangState = moduleRef.get(HangStateService, { strict: false })
  })

  beforeEach(() => {
    // Reset to a fully-healthy baseline so each test drives its own state.
    flakyState.setStatus('up')
    hangState.setArmed(false)
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * All-up baseline.
   *
   * Liveness must be 200 with no checks, and readiness must be 200 with all
   * three named indicators reporting up, the documented healthy shape.
   */
  it('serves liveness 200 and readiness 200 with three up checks', async () => {
    const live = await request(httpServer).get('/health/live')
    expect(live.status).toBe(200)
    expect(live.body).toEqual({ status: 'ok', checks: [] })

    const ready = await request(httpServer).get('/health/ready')
    expect(ready.status).toBe(200)
    const body = ready.body as HealthResponse
    expect(body.status).toBe('ok')
    expect(body.checks.map((entry) => entry.name).sort()).toEqual([
      'event-loop',
      'flaky',
      'hanging',
    ])
    expect(body.checks.every((entry) => entry.status === 'up')).toBe(true)
  })

  /**
   * Flaky down flips readiness and hides nothing.
   *
   * Toggling flaky down must turn readiness 503 with `status: 'error'`, the
   * flaky check down, while the event-loop check stays visible and up in the
   * same response, proving one failure never masks the others.
   */
  it('flips readiness to 503 when flaky is down, keeping event-loop visible', async () => {
    const toggle = await request(httpServer).post('/health-demo/flaky').query({ status: 'down' })
    expect(toggle.status).toBe(200)
    expect(toggle.body).toEqual({ name: 'flaky', state: 'down' })

    const ready = await request(httpServer).get('/health/ready')
    expect(ready.status).toBe(503)
    const body = ready.body as HealthResponse
    expect(body.status).toBe('error')
    expect(findCheck(body, 'flaky').status).toBe('down')
    expect(findCheck(body, 'event-loop').status).toBe('up')
  })

  /**
   * Recovery.
   *
   * After flaky returns to up, readiness must recover to 200, proving the flip
   * is fully reversible at runtime.
   */
  it('recovers to 200 when flaky is toggled back up', async () => {
    await request(httpServer).post('/health-demo/flaky').query({ status: 'down' })
    const down = await request(httpServer).get('/health/ready')
    expect(down.status).toBe(503)

    const toggle = await request(httpServer).post('/health-demo/flaky').query({ status: 'up' })
    expect(toggle.body).toEqual({ name: 'flaky', state: 'up' })
    const up = await request(httpServer).get('/health/ready')
    expect(up.status).toBe(200)
  })

  /**
   * Hang armed, down by timeout.
   *
   * Arming the hanging indicator must make readiness 503 with the hanging check
   * reported down carrying `timedOutAfterMs` equal to the configured timeout,
   * while the other indicators stay up: the timeout conversion is the library's,
   * and it downs only the hung check.
   */
  it('reports the hanging indicator down by timeout with a diagnostic', async () => {
    const toggle = await request(httpServer).post('/health-demo/hang').query({ enabled: 'true' })
    expect(toggle.status).toBe(200)
    expect(toggle.body).toEqual({ name: 'hanging', state: true })

    const ready = await request(httpServer).get('/health/ready')
    expect(ready.status).toBe(503)
    const body = ready.body as HealthResponse
    const hang = findCheck(body, 'hanging')
    expect(hang.status).toBe('down')
    expect(hang.details?.['timedOutAfterMs']).toBe(INDICATOR_TIMEOUT_MS)
    expect(findCheck(body, 'event-loop').status).toBe('up')
    expect(findCheck(body, 'flaky').status).toBe('up')
  })

  /**
   * Hang disarmed.
   *
   * Disarming must echo `state: false` and leave readiness at 200, covering the
   * `enabled=false` branch of the toggle.
   */
  it('disarms the hanging indicator and keeps readiness 200', async () => {
    await request(httpServer).post('/health-demo/hang').query({ enabled: 'true' })

    const toggle = await request(httpServer).post('/health-demo/hang').query({ enabled: 'false' })
    expect(toggle.body).toEqual({ name: 'hanging', state: false })

    const ready = await request(httpServer).get('/health/ready')
    expect(ready.status).toBe(200)
  })

  /**
   * Invalid toggles.
   *
   * A status or enabled value outside the accepted set must be rejected as the
   * library's `BYMAX_VALIDATION_FAILED` envelope, not silently ignored.
   */
  it('rejects invalid toggle values with a validation envelope', async () => {
    const flaky = await request(httpServer).post('/health-demo/flaky').query({ status: 'sideways' })
    expect(flaky.status).toBe(400)
    expect((flaky.body as { code: string }).code).toBe('BYMAX_VALIDATION_FAILED')

    const hang = await request(httpServer).post('/health-demo/hang').query({ enabled: 'maybe' })
    expect(hang.status).toBe(400)
    expect((hang.body as { code: string }).code).toBe('BYMAX_VALIDATION_FAILED')
  })
})
