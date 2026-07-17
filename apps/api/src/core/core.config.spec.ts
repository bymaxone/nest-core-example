/**
 * Unit tests for buildCoreOptions.
 *
 * Layer: unit.
 * Goal: verify the environment maps to the exact core options and that
 * exposeInternals is hard-guarded against production.
 * Mocks: a ConfigService stub over a full, typed environment.
 */

import type { ConfigService } from '@nestjs/config'
import { describe, expect, it } from '@jest/globals'

import type { Env } from '../config/env.schema.js'
import { buildCoreOptions } from './core.config.js'

/** A representative development environment. */
const BASE_ENV: Env = {
  NODE_ENV: 'development',
  PORT: 3001,
  WEB_ORIGIN: 'http://localhost:3000',
  ENVELOPE_EXPOSE_INTERNALS: true,
  TIMING_SLOW_THRESHOLD_MS: 500,
  TIMING_BUFFER_SIZE: 500,
  HEALTH_PATH: 'health',
  HEALTH_INDICATOR_TIMEOUT_MS: 2000,
  METRICS_ENABLED: true,
  METRICS_PATH: 'metrics',
  CATALOG_SEED_COUNT: 240,
  CATALOG_ORIGIN_LATENCY_MS: 120,
}

/** Build a ConfigService stub over BASE_ENV with optional overrides. */
function configFor(overrides: Partial<Env> = {}): ConfigService<Env, true> {
  const env: Env = { ...BASE_ENV, ...overrides }
  return { get: (key: keyof Env) => env[key] } as unknown as ConfigService<Env, true>
}

describe('buildCoreOptions', () => {
  /**
   * Full development mapping.
   *
   * Every option block must reflect the environment exactly, including the
   * static app label, so the wiring is a faithful copy-paste reference.
   */
  it('maps the full environment in development', () => {
    expect(buildCoreOptions(configFor())).toEqual({
      envelope: { enabled: true, exposeInternals: true },
      timing: { enabled: true, slowRequestThresholdMs: 500 },
      health: { enabled: true, path: 'health', indicatorTimeoutMs: 2000 },
      metrics: { enabled: true, path: 'metrics', defaultLabels: { app: 'nest-core-example' } },
    })
  })

  /**
   * Production hard-guard, security regression.
   *
   * Even with ENVELOPE_EXPOSE_INTERNALS=true, production must collapse
   * exposeInternals to false so no internal error detail leaks.
   */
  it('forces exposeInternals off in production', () => {
    const options = buildCoreOptions(
      configFor({ NODE_ENV: 'production', ENVELOPE_EXPOSE_INTERNALS: true }),
    )

    expect(options.envelope?.exposeInternals).toBe(false)
  })

  /**
   * Explicit opt-out in development.
   *
   * When the flag is false, exposeInternals must be false regardless of
   * environment.
   */
  it('honors an explicit false flag in development', () => {
    const options = buildCoreOptions(configFor({ ENVELOPE_EXPOSE_INTERNALS: false }))

    expect(options.envelope?.exposeInternals).toBe(false)
  })

  /**
   * Metrics disabled variant.
   *
   * METRICS_ENABLED=false must disable the metrics block so the zero-cost path
   * (no prom-client) is exercised.
   */
  it('reflects a disabled metrics configuration', () => {
    const options = buildCoreOptions(configFor({ METRICS_ENABLED: false, METRICS_PATH: 'prom' }))

    expect(options.metrics).toEqual({
      enabled: false,
      path: 'prom',
      defaultLabels: { app: 'nest-core-example' },
    })
  })
})
