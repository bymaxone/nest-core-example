/**
 * Integration tests for the Latency Lab timing proofs.
 *
 * Layer: integration (real Nest testing module, timing interceptor wired
 * exactly as production against the demo ring-buffer sink).
 * Goal: verify the global timing interceptor records `slow: true` above the
 * configured threshold and `slow: false` below it, that a failing request
 * still records its status, and that a poisoned sink never breaks the
 * request it observes while resuming normal recording afterward.
 * Mocks: a stubbed ConfigService supplying only the ring-buffer capacity.
 */

import type { Server } from 'node:http'

import type { ConfigService } from '@nestjs/config'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { BYMAX_TIMING_SINK, BymaxCoreModule } from '@bymax-one/nest-core'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'

import type { Env } from '../config/env.schema.js'
import { RingBufferTimingSink } from '../core/ring-buffer-timing.sink.js'
import { FailuresModule } from '../failures/failures.module.js'
import { TimingFeedModule } from '../timing-feed/timing-feed.module.js'
import { LatencyModule } from './latency.module.js'

/** Slow-request threshold used across this suite's assertions, in ms. */
const THRESHOLD_MS = 20

/** A real request delay comfortably above {@link THRESHOLD_MS}. */
const SLOW_DELAY_MS = 150

describe('Latency Lab: interceptor-wired timing proofs', () => {
  let app: INestApplication
  let httpServer: Server
  let sink: RingBufferTimingSink

  beforeAll(async () => {
    const configStub = { get: () => 50 } as unknown as ConfigService<Env, true>
    sink = new RingBufferTimingSink(configStub)

    // A minimal, test-scoped global module binding the demo sink under both
    // the class token (TimingFeedController's dependency) and the library's
    // BYMAX_TIMING_SINK token (honored on the `forRoot` path), mirroring how
    // the app's own CoreWiringModule wires the same sink app-wide.
    const sinkModule = {
      module: class TestSinkModule {},
      global: true,
      providers: [
        { provide: RingBufferTimingSink, useValue: sink },
        { provide: BYMAX_TIMING_SINK, useValue: sink },
      ],
      exports: [RingBufferTimingSink, BYMAX_TIMING_SINK],
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        BymaxCoreModule.forRoot({
          timing: { enabled: true, slowRequestThresholdMs: THRESHOLD_MS },
        }),
        sinkModule,
        LatencyModule,
        FailuresModule,
        TimingFeedModule,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
    httpServer = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * Slow flag above the threshold.
   *
   * A request whose handler takes longer than the configured threshold must
   * be recorded with `slow: true`, proving the interceptor's threshold math
   * end to end through a real HTTP round trip.
   */
  it('records slow: true for a request above the threshold', async () => {
    const before = sink.snapshot().length

    await request(httpServer).get(`/latency?ms=${SLOW_DELAY_MS}`).expect(200)

    const samples = sink.snapshot()
    expect(samples.length).toBe(before + 1)
    expect(samples[samples.length - 1]?.route).toBe('/latency')
    expect(samples[samples.length - 1]?.slow).toBe(true)
  })

  /**
   * Slow flag below the threshold.
   *
   * A fast request must be recorded with `slow: false`, giving the "not
   * slow" contrast to the case above.
   */
  it('records slow: false for a request below the threshold', async () => {
    const before = sink.snapshot().length

    await request(httpServer).get('/latency?ms=0').expect(200)

    const samples = sink.snapshot()
    expect(samples.length).toBe(before + 1)
    expect(samples[samples.length - 1]?.slow).toBe(false)
  })

  /**
   * Error statuses still recorded.
   *
   * A request that throws must still produce a timing sample carrying its
   * real status code rather than being silently skipped because it failed.
   */
  it('records the status of a failing request', async () => {
    const before = sink.snapshot().length

    await request(httpServer).post('/failures/conflict').expect(409)

    const samples = sink.snapshot()
    expect(samples.length).toBe(before + 1)
    expect(samples[samples.length - 1]?.statusCode).toBe(409)
  })

  /**
   * Poisoned sink never breaks the request, and resumes after.
   *
   * The interceptor records a request's sample only after its handler
   * completes, so arming the poison inside the `POST /timing/poison` handler
   * poisons that same request's own recording: the arm request must still
   * respond 202 while its sample is silently dropped. The poison is one-shot,
   * so the very next request must record normally again.
   */
  it('never fails the poison-arming request, and resumes recording after', async () => {
    const before = sink.snapshot().length

    const armResponse = await request(httpServer).post('/timing/poison')
    expect(armResponse.status).toBe(202)
    // The arm request's own record() call throws (poisoned) and is swallowed.
    expect(sink.snapshot().length).toBe(before)

    await request(httpServer).get('/latency?ms=0').expect(200)
    // Poison is one-shot: this next request records normally again.
    expect(sink.snapshot().length).toBe(before + 1)
  })
})
