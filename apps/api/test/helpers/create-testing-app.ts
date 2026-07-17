/**
 * @fileoverview Test app factory booting the real `AppModule` in-process.
 *
 * `AppModule` is imported dynamically, after the env overrides for this call
 * are written to `process.env`: `ConfigModule.forRoot` validates the
 * environment synchronously the moment its module metadata is evaluated, so a
 * static top-level import would freeze the default (development) env before a
 * spec's overrides take effect. Jest gives each e2e spec file a fresh module
 * registry, so the deferred import re-validates with the right env once per
 * file.
 *
 * A deterministic baseline (a fast, deterministic catalog seed; a short health
 * indicator timeout so the hanging-indicator variant does not slow the suite)
 * is applied first and then merged with per-spec overrides, so one spec's
 * overrides never leak into another's baseline expectations.
 *
 * @layer test-helper
 */

import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import type { Server } from 'node:http'

/** The booted application plus the handles specs reach for most often. */
export interface TestApiApp {
  /** The initialized, listening Nest application (every lifecycle hook has run). */
  readonly app: INestApplication
  /** Ephemeral loopback port the HTTP server is listening on. */
  readonly port: number
  /** Loopback base URL for HTTP clients (`http://127.0.0.1:<port>`). */
  readonly baseUrl: string
}

/** Deterministic env baseline applied before any per-spec override. */
const BASELINE_ENV: Readonly<Record<string, string>> = {
  NODE_ENV: 'development',
  WEB_ORIGIN: 'http://localhost:3000',
  ENVELOPE_EXPOSE_INTERNALS: 'true',
  TIMING_SLOW_THRESHOLD_MS: '500',
  TIMING_BUFFER_SIZE: '500',
  HEALTH_PATH: 'health',
  // Shorter than the documented 2000ms default so the hanging-indicator
  // variant does not slow every run of this suite by multiple seconds.
  HEALTH_INDICATOR_TIMEOUT_MS: '300',
  METRICS_ENABLED: 'true',
  METRICS_PATH: 'metrics',
  CATALOG_SEED_COUNT: '20',
  CATALOG_ORIGIN_LATENCY_MS: '0',
}

/**
 * Write env values to `process.env`, returning a restorer that puts the prior
 * values (or absence) back exactly as found.
 *
 * @param values - Env entries to set for the duration of one test file.
 * @returns A function that restores every touched key to its prior state.
 */
function applyEnv(values: Readonly<Record<string, string>>): () => void {
  const previous = new Map<string, string | undefined>()
  for (const key of Object.keys(values)) {
    previous.set(key, process.env[key])
  }
  Object.assign(process.env, values)
  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

/**
 * Build and initialize the production `AppModule` with a deterministic,
 * fast-for-tests environment.
 *
 * @param env - Optional per-spec env overrides merged over {@link BASELINE_ENV}.
 * @returns The listening app plus its bound port and base URL.
 * @throws Error when the server fails to bind a loopback TCP port.
 */
export async function createTestingApp(
  env: Readonly<Record<string, string>> = {},
): Promise<TestApiApp> {
  const mergedEnv = { ...BASELINE_ENV, ...env }
  const restoreEnv = applyEnv(mergedEnv)
  try {
    const { AppModule } = await import('../../src/app.module.js')
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    const app = moduleRef.createNestApplication()
    app.enableCors({ origin: mergedEnv.WEB_ORIGIN })
    await app.listen(0, '127.0.0.1')

    const server: Server = app.getHttpServer()
    const address = server.address()
    if (address === null || typeof address === 'string') {
      throw new Error('Test server did not bind a TCP port')
    }

    return { app, port: address.port, baseUrl: `http://127.0.0.1:${address.port}` }
  } finally {
    // The env only needs to seed module evaluation; the rest of the spec file
    // must never depend on process.env still carrying these overrides.
    restoreEnv()
  }
}
