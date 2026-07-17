/**
 * @fileoverview Disabled-feature E2E, one isolated `forRoot`-registered
 * module per feature (Feature-Coverage matrix rows 10-11, 60-61). A disabled
 * feature registers zero providers/controllers at module-definition time
 * (only true on the synchronous `forRoot` path), so each variant proves the
 * absence directly rather than a request-time guard.
 *
 * The `prom-client` "never loaded" proof (matrix row 61) does not inspect
 * Node's raw `require.cache`: Jest's `--experimental-vm-modules` runtime
 * gives every test file its own isolated ES-module registry rather than
 * reusing Node's process-wide `Module._cache`, so a real module's presence
 * there would not reliably reflect what Jest actually resolved for this
 * file. Instead this file registers a `jest.unstable_mockModule('prom-client', ...)`
 * spy whose factory sets a flag only when Jest actually resolves the
 * specifier; since a mock factory is invoked at most once, lazily, on first
 * resolution, an untouched flag after boot and a request is a direct proof
 * that nothing in the disabled-metrics path ever imported the module.
 * @layer test
 */

import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { Controller, Get, Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'

import { httpAgent } from '../helpers/http.js'

/** Whether Jest's module registry ever resolved the `prom-client` mock. */
let hasResolvedPromClient = false

jest.unstable_mockModule('prom-client', () => {
  hasResolvedPromClient = true
  return { Registry: class {}, Counter: class {}, collectDefaultMetrics: () => undefined }
})

// Deferred until after the mock above is registered, so any code path this
// spec exercises that reaches for the optional peer resolves the mock.
const { BymaxCoreModule, BYMAX_TIMING_SINK } = await import('@bymax-one/nest-core')

/** A trivial route every isolated variant module can hit. */
@Controller()
class ProbeController {
  @Get('probe')
  probe(): { ok: true } {
    return { ok: true }
  }
}

/** Minimal module exposing only {@link ProbeController}, reused by every variant below. */
@Module({ controllers: [ProbeController] })
class ProbeModule {}

describe('disabled-feature variants (sync forRoot, one module per feature)', () => {
  describe('health.enabled: false', () => {
    let app: INestApplication

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [BymaxCoreModule.forRoot({ health: { enabled: false } }), ProbeModule],
      }).compile()
      app = moduleRef.createNestApplication()
      await app.init()
    })

    afterAll(async () => {
      await app.close()
    })

    /** No health controller is registered at all: the route 404s like any unmatched path. */
    it('GET /health/ready 404s with the BYMAX_NOT_FOUND envelope', async () => {
      const response = await httpAgent(app).get('/health/ready')

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({ code: 'BYMAX_NOT_FOUND' })
    })
  })

  describe('metrics.enabled: false (explicit)', () => {
    let app: INestApplication

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [BymaxCoreModule.forRoot({ metrics: { enabled: false } }), ProbeModule],
      }).compile()
      app = moduleRef.createNestApplication()
      await app.init()
    })

    afterAll(async () => {
      await app.close()
    })

    /** No metrics controller is registered: /metrics 404s. */
    it('GET /metrics 404s', async () => {
      const response = await httpAgent(app).get('/metrics')

      expect(response.status).toBe(404)
    })

    /**
     * The optional peer is never resolved.
     *
     * A request through the disabled-metrics module must never trigger a
     * resolution of `prom-client`; see the file header for why this is
     * asserted through a mock-resolution flag rather than a module cache.
     */
    it('never resolves the prom-client module', async () => {
      await httpAgent(app).get('/probe')

      expect(hasResolvedPromClient).toBe(false)
    })
  })

  describe('envelope.enabled: false', () => {
    let app: INestApplication

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [BymaxCoreModule.forRoot({ envelope: { enabled: false } }), ProbeModule],
      }).compile()
      app = moduleRef.createNestApplication()
      await app.init()
    })

    afterAll(async () => {
      await app.close()
    })

    /**
     * Raw Nest default error shape, not the library's envelope.
     *
     * With no global exception filter registered, an unmatched route falls
     * through to Nest's own default shape (`statusCode`/`message`/`error`),
     * carrying none of the envelope's `code`, `timestamp`, `path`, or
     * `correlationId` fields.
     */
    it('GET /unregistered returns the raw Nest error shape', async () => {
      const response = await httpAgent(app).get('/unregistered')

      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({ statusCode: 404, error: 'Not Found' })
      expect(response.body.code).toBeUndefined()
      expect(response.body.timestamp).toBeUndefined()
      expect(response.body.path).toBeUndefined()
      expect(response.body.correlationId).toBeUndefined()
    })
  })

  describe('timing.enabled: false', () => {
    let app: INestApplication
    let sink: { record: ReturnType<typeof jest.fn> }

    beforeAll(async () => {
      sink = { record: jest.fn() }
      const moduleRef = await Test.createTestingModule({
        imports: [BymaxCoreModule.forRoot({ timing: { enabled: false } }), ProbeModule],
      })
        .overrideProvider(BYMAX_TIMING_SINK)
        .useValue(sink)
        .compile()
      app = moduleRef.createNestApplication()
      await app.init()
    })

    afterAll(async () => {
      await app.close()
    })

    /**
     * The timing interceptor is never registered.
     *
     * With `timing.enabled: false`, no `TimingInterceptor` runs, so a bound
     * sink (honored on the sync `forRoot` path) never receives a sample for
     * any request, proving the feature is truly gated off, not merely fed a
     * no-op sink.
     */
    it('never calls the bound timing sink for a completed request', async () => {
      const response = await httpAgent(app).get('/probe')

      expect(response.status).toBe(200)
      expect(sink.record).not.toHaveBeenCalled()
    })
  })
})
