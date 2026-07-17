/**
 * Unit tests for the environment schema and validateEnv.
 *
 * Layer: unit.
 * Goal: prove fail-fast validation, coercion, default application, and the
 * aggregated multi-issue report.
 * Mocks: none, validateEnv is a pure function over a plain record.
 */

import { describe, expect, it } from '@jest/globals'

import { validateEnv } from './env.schema.js'

describe('validateEnv', () => {
  /**
   * Fully specified environment.
   *
   * Every string input must coerce to its typed shape (numbers as numbers,
   * "true"/"false" as booleans), proving feature code receives typed config.
   */
  it('coerces a fully specified environment into typed values', () => {
    // Arrange
    const raw = {
      NODE_ENV: 'production',
      PORT: '4000',
      WEB_ORIGIN: 'https://dashboard.example.com',
      ENVELOPE_EXPOSE_INTERNALS: 'false',
      TIMING_SLOW_THRESHOLD_MS: '250',
      TIMING_BUFFER_SIZE: '128',
      HEALTH_PATH: 'healthz',
      HEALTH_INDICATOR_TIMEOUT_MS: '1500',
      METRICS_ENABLED: 'true',
      METRICS_PATH: 'prom',
      CATALOG_SEED_COUNT: '10',
      CATALOG_ORIGIN_LATENCY_MS: '0',
    }

    // Act
    const env = validateEnv(raw)

    // Assert
    expect(env).toEqual({
      NODE_ENV: 'production',
      PORT: 4000,
      WEB_ORIGIN: 'https://dashboard.example.com',
      ENVELOPE_EXPOSE_INTERNALS: false,
      TIMING_SLOW_THRESHOLD_MS: 250,
      TIMING_BUFFER_SIZE: 128,
      HEALTH_PATH: 'healthz',
      HEALTH_INDICATOR_TIMEOUT_MS: 1500,
      METRICS_ENABLED: true,
      METRICS_PATH: 'prom',
      CATALOG_SEED_COUNT: 10,
      CATALOG_ORIGIN_LATENCY_MS: 0,
    })
  })

  /**
   * Empty environment edge case.
   *
   * With no variables set, every documented development default must apply so
   * a fresh checkout boots with zero configuration.
   */
  it('applies every documented default when nothing is set', () => {
    const env = validateEnv({})

    expect(env).toEqual({
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
    })
  })

  /**
   * Non-numeric integer input.
   *
   * A required numeric variable that cannot be coerced must abort startup and
   * name the offending variable, never fall back to a silent default.
   */
  it('rejects a non-numeric PORT and names it in the report', () => {
    expect(() => validateEnv({ PORT: 'not-a-number' })).toThrow(/PORT/)
  })

  /**
   * Zero for a strictly positive variable.
   *
   * A ring buffer of size zero is nonsensical, so `TIMING_BUFFER_SIZE=0` must
   * fail rather than silently disable timing capture.
   */
  it('rejects a non-positive TIMING_BUFFER_SIZE', () => {
    expect(() => validateEnv({ TIMING_BUFFER_SIZE: '0' })).toThrow(/TIMING_BUFFER_SIZE/)
  })

  /**
   * Ambiguous boolean input.
   *
   * Only "true"/"false" are accepted; a truthy-looking "yes" must fail so no
   * feature toggle is enabled by accident.
   */
  it('rejects a non-boolean ENVELOPE_EXPOSE_INTERNALS', () => {
    expect(() => validateEnv({ ENVELOPE_EXPOSE_INTERNALS: 'yes' })).toThrow(
      /ENVELOPE_EXPOSE_INTERNALS/,
    )
  })

  /**
   * Malformed URL input.
   *
   * WEB_ORIGIN drives the CORS allow-list, so an invalid origin must abort
   * rather than produce a broken allow-list at runtime.
   */
  it('rejects a malformed WEB_ORIGIN', () => {
    expect(() => validateEnv({ WEB_ORIGIN: 'not a url' })).toThrow(/WEB_ORIGIN/)
  })

  /**
   * Unknown enum member.
   *
   * NODE_ENV gates production-only behavior, so an unrecognized value must
   * fail loudly instead of collapsing to an implicit environment.
   */
  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/)
  })

  /**
   * Multiple simultaneous failures.
   *
   * The report must aggregate every issue in one message so an operator fixes
   * the whole configuration in a single pass.
   */
  it('aggregates every issue into one readable report', () => {
    // Act
    let message = ''
    try {
      validateEnv({ PORT: 'x', METRICS_ENABLED: 'maybe' })
    } catch (error) {
      message = (error as Error).message
    }

    // Assert
    expect(message).toContain('Invalid environment configuration')
    expect(message).toContain('PORT')
    expect(message).toContain('METRICS_ENABLED')
    // Each issue lands on its own line: the header plus one line per failing
    // variable, proving the issues are newline-joined rather than concatenated.
    const lines = message.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain('PORT')
    expect(lines[2]).toContain('METRICS_ENABLED')
  })

  /**
   * Non-object input boundary.
   *
   * A non-object environment yields a root-level issue, exercising the
   * "(root)" path rendering in the report.
   */
  it('rejects a non-object environment with a root-level issue', () => {
    expect(() => validateEnv('nope' as unknown as Record<string, unknown>)).toThrow(/\(root\)/)
  })
})
