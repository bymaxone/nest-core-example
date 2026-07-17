/**
 * @fileoverview Zod-validated environment contract for the reference API. Every
 * variable in the Environment Variable Registry is declared here with its
 * documented development default, so a fresh checkout boots with zero
 * configuration while a malformed value aborts startup with a readable report.
 * @layer config
 *
 * This module is the ONLY place in the application allowed to read
 * `process.env`. Feature code injects the typed `ConfigService<Env, true>`
 * instead, keeping configuration access centralized and type-safe.
 */

import { z } from 'zod'
import type { ZodError } from 'zod'

/**
 * Parse an environment string as a strict boolean.
 *
 * Env values are always strings, so the permissive `z.coerce.boolean()` (which
 * treats any non-empty string as `true`, including `"false"`) is unsafe here.
 * Only the literals `"true"` and `"false"` are accepted; anything else fails
 * validation instead of silently defaulting.
 *
 * @param defaultLiteral - The `"true"` or `"false"` string applied when the
 *   variable is absent.
 * @returns A schema resolving to a boolean.
 */
function booleanFromEnv(defaultLiteral: 'true' | 'false') {
  return z
    .enum(['true', 'false'])
    .default(defaultLiteral)
    .transform((value) => value === 'true')
}

/**
 * Parse an environment string as a non-negative integer.
 *
 * @param defaultValue - Value applied when the variable is absent.
 * @returns A schema resolving to an integer >= 0.
 */
function nonNegativeIntFromEnv(defaultValue: number) {
  return z.coerce.number().int().nonnegative().default(defaultValue)
}

/**
 * Parse an environment string as a positive integer (>= 1).
 *
 * @param defaultValue - Value applied when the variable is absent.
 * @returns A schema resolving to an integer >= 1.
 */
function positiveIntFromEnv(defaultValue: number) {
  return z.coerce.number().int().positive().default(defaultValue)
}

/**
 * The full environment schema. Field order mirrors the Environment Variable
 * Registry; every field carries the documented development default.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: positiveIntFromEnv(3001),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  ENVELOPE_EXPOSE_INTERNALS: booleanFromEnv('true'),
  TIMING_SLOW_THRESHOLD_MS: nonNegativeIntFromEnv(500),
  TIMING_BUFFER_SIZE: positiveIntFromEnv(500),
  HEALTH_PATH: z.string().min(1).default('health'),
  HEALTH_INDICATOR_TIMEOUT_MS: positiveIntFromEnv(2000),
  METRICS_ENABLED: booleanFromEnv('true'),
  METRICS_PATH: z.string().min(1).default('metrics'),
  CATALOG_SEED_COUNT: positiveIntFromEnv(240),
  CATALOG_ORIGIN_LATENCY_MS: nonNegativeIntFromEnv(120),
})

/** The fully validated, typed environment. Every field is always present. */
export type Env = z.infer<typeof envSchema>

/**
 * Render every validation issue into one readable, multi-line report so an
 * operator sees all misconfigured variables at once rather than one per retry.
 *
 * @param error - The aggregated Zod error from a failed parse.
 * @returns A human-readable configuration report.
 */
function formatEnvError(error: ZodError): string {
  const lines = error.issues.map((issue) => {
    // Stryker disable next-line StringLiteral: every env key is top-level, so an issue path never has more than one segment and the join separator is never observable; the mutant is provably equivalent.
    const joinedPath = issue.path.join('.')
    const path = issue.path.length > 0 ? joinedPath : '(root)'
    return `  - ${path}: ${issue.message}`
  })
  return `Invalid environment configuration:\n${lines.join('\n')}`
}

/**
 * Validate the raw environment and return the typed, defaults-applied result.
 *
 * Wired into `ConfigModule.forRoot({ validate: validateEnv })`, so an invalid
 * or missing required value aborts the bootstrap before the first request.
 *
 * @param config - The raw environment record (typically `process.env`).
 * @returns The validated environment with coerced types and applied defaults.
 * @throws Error when one or more variables fail validation; the message lists
 *   every offending variable.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config)
  if (result.success) {
    return result.data
  }
  throw new Error(formatEnvError(result.error))
}
