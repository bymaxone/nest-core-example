/**
 * @fileoverview Compile-time resolution probe for `@bymax-one/nest-core`.
 * @layer utility
 *
 * Imports from all three published subpaths (`.`, `./pagination`, `./health`) so
 * that `tsc` / `pnpm typecheck` fail loudly the moment the packaged `exports`
 * map, a `.d.ts` entry, or an exported name regresses. The module is inert at
 * runtime: it constructs no providers, boots no Nest application, and performs no
 * I/O. It only reads stable, side-effect-free metadata (the module class name,
 * the five dependency-injection Symbol descriptions, the pure helper names) plus
 * a few typed sample literals into {@link LIBRARY_PROBE}, which the unit suite
 * asserts. Real wiring replaces this probe once the API is bootstrapped.
 */

import {
  BYMAX_CORE_OPTIONS,
  BYMAX_CORRELATION_PROVIDER,
  BYMAX_HEALTH_INDICATORS,
  BYMAX_METRICS_REGISTRY,
  BYMAX_TIMING_SINK,
  BymaxCoreModule,
  type BymaxCoreModuleOptions,
  type RequestTimingSample,
} from '@bymax-one/nest-core'
import {
  buildPageResult,
  decodeCursor,
  encodeCursor,
  normalizePageQuery,
} from '@bymax-one/nest-core/pagination'
import type { HealthIndicatorResult, IHealthIndicator } from '@bymax-one/nest-core/health'

/**
 * The five dependency-injection Symbol tokens published by the root subpath, in
 * documented order. Each token's `.description` is its stable public identity.
 */
const CORE_TOKENS = [
  BYMAX_CORE_OPTIONS,
  BYMAX_CORRELATION_PROVIDER,
  BYMAX_TIMING_SINK,
  BYMAX_HEALTH_INDICATORS,
  BYMAX_METRICS_REGISTRY,
] as const

/** The four pure pagination helpers the example consumes from `./pagination`. */
const PAGINATION_HELPERS = [
  normalizePageQuery,
  buildPageResult,
  encodeCursor,
  decodeCursor,
] as const

// Typed sample literals prove each imported type is not merely importable but
// structurally usable. They are never handed to the library at runtime.
const sampleOptions: BymaxCoreModuleOptions = {}

const sampleTimingSample: RequestTimingSample = {
  method: 'GET',
  route: '/probe',
  statusCode: 200,
  durationMs: 1,
  slow: false,
}

// `keyof IHealthIndicator` references the indicator contract at compile time
// without a runtime method body, keeping the probe inert and fully covered.
const HEALTH_INDICATOR_KEYS = [
  'name',
  'check',
] as const satisfies readonly (keyof IHealthIndicator)[]

const sampleResult: HealthIndicatorResult = { status: 'up' }

/**
 * Inert summary of what resolved from each subpath. The unit suite asserts it so
 * a broken `exports` map surfaces as a failing test in addition to a type error.
 */
export const LIBRARY_PROBE = {
  /** Root subpath (`@bymax-one/nest-core`): the module, five DI tokens, two typed shapes. */
  root: {
    moduleName: BymaxCoreModule.name,
    tokenCount: CORE_TOKENS.length,
    tokenDescriptions: CORE_TOKENS.map((token) => token.description),
    optionKeys: Object.keys(sampleOptions),
    timingSampleKeys: Object.keys(sampleTimingSample),
  },
  /** Pagination subpath (`@bymax-one/nest-core/pagination`): four pure helpers. */
  pagination: {
    helperCount: PAGINATION_HELPERS.length,
    helperNames: PAGINATION_HELPERS.map((helper) => helper.name),
  },
  /** Health subpath (`@bymax-one/nest-core/health`): the indicator contract and its result. */
  health: {
    indicatorKeys: HEALTH_INDICATOR_KEYS,
    resultStatus: sampleResult.status,
  },
} as const
