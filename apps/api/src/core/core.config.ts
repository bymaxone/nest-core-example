/**
 * @fileoverview The canonical wiring artifact: `buildCoreOptions` translates the
 * Zod-validated environment into `BymaxCoreModuleOptions`. It is the piece a real
 * consumer copies, so it is deliberately explicit about every option block.
 * @layer config
 */

import type { ConfigService } from '@nestjs/config'
import type { BymaxCoreModuleOptions } from '@bymax-one/nest-core'

import type { Env } from '../config/env.schema.js'

/**
 * Build `BymaxCoreModuleOptions` from the typed configuration service.
 *
 * `envelope.exposeInternals` is hardened against misconfiguration: it is only
 * ever `true` outside production, so setting `ENVELOPE_EXPOSE_INTERNALS=true` in
 * a production environment still collapses to `false` and no internal error
 * detail can leak.
 *
 * @param config - Typed config service over the validated environment.
 * @returns Fully formed core options for `BymaxCoreModule.forRootAsync`.
 */
export function buildCoreOptions(config: ConfigService<Env, true>): BymaxCoreModuleOptions {
  const isProduction = config.get('NODE_ENV', { infer: true }) === 'production'
  return {
    envelope: {
      enabled: true,
      exposeInternals: !isProduction && config.get('ENVELOPE_EXPOSE_INTERNALS', { infer: true }),
    },
    timing: {
      enabled: true,
      slowRequestThresholdMs: config.get('TIMING_SLOW_THRESHOLD_MS', { infer: true }),
    },
    health: {
      enabled: true,
      path: config.get('HEALTH_PATH', { infer: true }),
      indicatorTimeoutMs: config.get('HEALTH_INDICATOR_TIMEOUT_MS', { infer: true }),
    },
    metrics: {
      enabled: config.get('METRICS_ENABLED', { infer: true }),
      path: config.get('METRICS_PATH', { infer: true }),
      defaultLabels: { app: 'nest-core-example' },
    },
  }
}
