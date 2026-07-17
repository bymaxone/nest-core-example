/**
 * @fileoverview E2E: liveness, readiness, and the two runtime toggles over
 * real HTTP, covering the aggregation contract, one failing indicator hiding
 * nothing, and the hanging indicator's timeout diagnostic (Feature-Coverage
 * matrix rows 52-58).
 * @layer test
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals'
import type { INestApplication } from '@nestjs/common'

import { createTestingApp } from './helpers/create-testing-app.js'
import { httpAgent } from './helpers/http.js'

/** Matches the suite's baseline `HEALTH_INDICATOR_TIMEOUT_MS` override. */
const INDICATOR_TIMEOUT_MS = 300

describe('health console', () => {
  let app: INestApplication

  beforeAll(async () => {
    ;({ app } = await createTestingApp())
  })

  afterAll(async () => {
    await app.close()
  })

  /** Liveness never depends on any indicator: always 200 with an empty checks array. */
  it('GET /health/live returns ok with an empty checks array', async () => {
    const response = await httpAgent(app).get('/health/live')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', checks: [] })
  })

  /** With every indicator up, readiness reports 200 and names all three checks. */
  it('GET /health/ready returns 200 with every indicator up by default', async () => {
    const response = await httpAgent(app).get('/health/ready')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    const names = (response.body.checks as { name: string; status: string }[]).map((c) => c.name)
    expect(names.sort()).toEqual(['event-loop', 'flaky', 'hanging'])
    expect(
      (response.body.checks as { status: string }[]).every((check) => check.status === 'up'),
    ).toBe(true)
  })

  describe('flaky indicator toggle', () => {
    afterEach(async () => {
      // Always leave the shared indicator state clean for the next test.
      await httpAgent(app).post('/health-demo/flaky').query({ status: 'up' })
    })

    /**
     * One failing indicator flips readiness without hiding the others.
     *
     * With `flaky` forced down, readiness must reply 503, but the
     * `event-loop` indicator still reports `up` in the same response
     * (Feature-Coverage matrix row 58: concurrent aggregation, one failure
     * hides nothing).
     */
    it('flipping flaky to down turns readiness 503 without hiding event-loop', async () => {
      const toggle = await httpAgent(app).post('/health-demo/flaky').query({ status: 'down' })
      expect(toggle.status).toBe(200)
      expect(toggle.body).toEqual({ name: 'flaky', state: 'down' })

      const ready = await httpAgent(app).get('/health/ready')

      expect(ready.status).toBe(503)
      expect(ready.body.status).toBe('error')
      const byName = new Map(
        (ready.body.checks as { name: string; status: string }[]).map((c) => [c.name, c.status]),
      )
      expect(byName.get('flaky')).toBe('down')
      expect(byName.get('event-loop')).toBe('up')
    })

    /** An invalid toggle value rejects with the validation envelope, not a silent clamp. */
    it('rejects an invalid flaky status with BYMAX_VALIDATION_FAILED', async () => {
      const response = await httpAgent(app).post('/health-demo/flaky').query({ status: 'sideways' })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('BYMAX_VALIDATION_FAILED')
    })
  })

  describe('hanging indicator toggle', () => {
    afterEach(async () => {
      await httpAgent(app).post('/health-demo/hang').query({ enabled: 'false' })
    })

    /**
     * Timeout-by-aggregator, with a diagnostic detail.
     *
     * Once armed, the hanging indicator sleeps past the configured
     * per-indicator timeout; the library's aggregator (not the indicator
     * itself) converts that into a `down` entry carrying a bounded
     * `timedOutAfterMs` diagnostic, and the response completes in roughly the
     * configured timeout rather than waiting for the indicator's full sleep.
     */
    it('arming hang reports the indicator down by timeout with a diagnostic detail', async () => {
      const toggle = await httpAgent(app).post('/health-demo/hang').query({ enabled: 'true' })
      expect(toggle.status).toBe(200)
      expect(toggle.body).toEqual({ name: 'hanging', state: true })

      const start = Date.now()
      const ready = await httpAgent(app).get('/health/ready')
      const elapsedMs = Date.now() - start

      expect(ready.status).toBe(503)
      const hanging = (
        ready.body.checks as { name: string; status: string; details?: unknown }[]
      ).find((check) => check.name === 'hanging')
      expect(hanging).toMatchObject({
        status: 'down',
        details: { timedOutAfterMs: INDICATOR_TIMEOUT_MS },
      })
      // Bounded well under the indicator's own (timeout + 250ms) sleep,
      // proving the aggregator's timeout won the race, not the indicator.
      expect(elapsedMs).toBeLessThan(INDICATOR_TIMEOUT_MS + 250)
    })
  })
})
