/**
 * Unit tests for the `@bymax-one/nest-core` resolution probe.
 *
 * Layer: unit.
 * Goal: assert that all three published subpaths resolved to their documented
 *   shapes (module, five DI tokens, four pagination helpers, health contracts)
 *   and that the cursor codec round-trips, so an `exports`-map or `.d.ts`
 *   regression fails a test as well as the type-checker.
 * Mocks: none. The probe is inert and the cursor helpers are pure, so both run
 *   directly in unit scope with no Nest DI container.
 */

import { describe, expect, it } from '@jest/globals'
import { decodeCursor, encodeCursor } from '@bymax-one/nest-core/pagination'

import { LIBRARY_PROBE } from './library-probe.js'

describe('LIBRARY_PROBE', () => {
  /**
   * Root subpath resolution.
   *
   * The module class and the five DI Symbol tokens must resolve by their
   * documented names; a rename or a dropped export from `@bymax-one/nest-core`
   * would change these values and fail here, mirroring the type error.
   */
  it('resolves the root subpath module and the five DI tokens', () => {
    expect(LIBRARY_PROBE.root.moduleName).toBe('BymaxCoreModule')
    expect(LIBRARY_PROBE.root.tokenCount).toBe(5)
    expect(LIBRARY_PROBE.root.tokenDescriptions).toEqual([
      'BYMAX_CORE_OPTIONS',
      'BYMAX_CORRELATION_PROVIDER',
      'BYMAX_TIMING_SINK',
      'BYMAX_HEALTH_INDICATORS',
      'BYMAX_METRICS_REGISTRY',
    ])
  })

  /**
   * Root subpath typed shapes.
   *
   * `BymaxCoreModuleOptions` is an all-optional options bag (so an empty literal
   * is valid) and `RequestTimingSample` is a fixed five-field record; the
   * probe's sample literals prove both imported types are structurally usable.
   */
  it('exposes the typed root shapes it imported', () => {
    expect(LIBRARY_PROBE.root.optionKeys).toEqual([])
    expect(LIBRARY_PROBE.root.timingSampleKeys).toEqual([
      'method',
      'route',
      'statusCode',
      'durationMs',
      'slow',
    ])
  })

  /**
   * Pagination subpath resolution.
   *
   * The four pure helpers must resolve as named functions from
   * `@bymax-one/nest-core/pagination`; this guards the second subpath entry in
   * the packaged `exports` map.
   */
  it('resolves the four pagination helpers', () => {
    expect(LIBRARY_PROBE.pagination.helperCount).toBe(4)
    expect(LIBRARY_PROBE.pagination.helperNames).toEqual([
      'normalizePageQuery',
      'buildPageResult',
      'encodeCursor',
      'decodeCursor',
    ])
  })

  /**
   * Health subpath resolution.
   *
   * The health contracts are type-only; the probe's `keyof IHealthIndicator`
   * key list and its sample result prove the third subpath's `.d.ts` resolves
   * and its shapes are usable.
   */
  it('resolves the health subpath contracts', () => {
    expect(LIBRARY_PROBE.health.indicatorKeys).toEqual(['name', 'check'])
    expect(LIBRARY_PROBE.health.resultStatus).toBe('up')
  })

  /**
   * Cursor codec round-trip.
   *
   * `decodeCursor(encodeCursor(x))` must reconstruct the original payload,
   * preserving both string and number field types; this exercises the pure
   * pagination helpers end to end, not just their type resolution.
   */
  it('round-trips a payload through decodeCursor(encodeCursor(x))', () => {
    // Arrange
    const payload = { id: 'catalog-42', page: 3 }

    // Act
    const restored = decodeCursor<typeof payload>(encodeCursor(payload))

    // Assert
    expect(restored).toEqual(payload)
  })
})
