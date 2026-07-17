/**
 * @fileoverview The canonical wiring artifact: `buildCoreOptions` translates the
 * Zod-validated environment into `BymaxCoreModuleOptions`. It is the piece a real
 * consumer copies, so it is deliberately explicit about every option block.
 * @layer config
 */

import type { ConfigService } from '@nestjs/config'
import type {
  BymaxCoreModuleOptions,
  EnvelopeOptions,
  HealthOptions,
  MetricsOptions,
  TimingOptions,
} from '@bymax-one/nest-core'

import type { Env } from '../config/env.schema.js'

/**
 * Compile-time-only option that makes `ConfigService.get` infer each value's
 * type from `Env` instead of widening to `any`. The `infer` flag is a TypeScript
 * marker with no runtime effect, so it is hoisted once and reused at every read.
 */
// Stryker disable next-line ObjectLiteral,BooleanLiteral: `infer` is a compile-time type hint with no runtime behavior; emptying the object or flipping the flag reads the same value.
const INFER = { infer: true } as const

/**
 * Build `BymaxCoreModuleOptions` from the typed configuration service.
 *
 * Each library option block is assembled into its named option type
 * (`EnvelopeOptions`, `TimingOptions`, `HealthOptions`, `MetricsOptions`) so the
 * wiring a consumer copies is explicit about the surface it configures.
 * `envelope.exposeInternals` is hardened against misconfiguration: it is only
 * ever `true` outside production, so setting `ENVELOPE_EXPOSE_INTERNALS=true` in
 * a production environment still collapses to `false` and no internal error
 * detail can leak.
 *
 * @param config - Typed config service over the validated environment.
 * @returns Fully formed core options for `BymaxCoreModule.forRootAsync`.
 */
export function buildCoreOptions(config: ConfigService<Env, true>): BymaxCoreModuleOptions {
  const isProduction = config.get('NODE_ENV', INFER) === 'production'
  const envelope: EnvelopeOptions = {
    enabled: true,
    exposeInternals: !isProduction && config.get('ENVELOPE_EXPOSE_INTERNALS', INFER),
  }
  const timing: TimingOptions = {
    enabled: true,
    slowRequestThresholdMs: config.get('TIMING_SLOW_THRESHOLD_MS', INFER),
  }
  const health: HealthOptions = {
    enabled: true,
    path: config.get('HEALTH_PATH', INFER),
    indicatorTimeoutMs: config.get('HEALTH_INDICATOR_TIMEOUT_MS', INFER),
  }
  const metrics: MetricsOptions = {
    enabled: config.get('METRICS_ENABLED', INFER),
    path: config.get('METRICS_PATH', INFER),
    defaultLabels: { app: 'nest-core-example' },
  }
  return { envelope, timing, health, metrics }
}
