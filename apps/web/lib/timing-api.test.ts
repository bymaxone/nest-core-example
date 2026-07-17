/**
 * Unit tests for the request-timing feed wrapper.
 *
 * Layer: unit.
 * Goal: verify that both endpoints call the documented path/method through
 *   the shared `request()` client and pass its result through unchanged.
 * Mocks: `./api-client#request`.
 */

import { describe, expect, it, vi } from 'vitest'

import { getTimingSamples, poisonTimingSink, summarizeSamples } from './timing-api'
import type { RequestTimingSample } from './timing-api'
import { request } from './api-client'

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>()
  return { ...actual, request: vi.fn() }
})

describe('getTimingSamples', () => {
  /**
   * Path and passthrough.
   *
   * Calls `GET /timing/samples` with no init and returns the client's
   * result untouched.
   */
  it('requests GET /timing/samples and returns the result', async () => {
    // Arrange
    const payload = { ok: true as const, data: { thresholdMs: 500, samples: [] } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await getTimingSamples()

    // Assert
    expect(request).toHaveBeenCalledWith('/timing/samples')
    expect(result).toBe(payload)
  })
})

describe('poisonTimingSink', () => {
  /**
   * Path, method, and passthrough.
   *
   * Calls `POST /timing/poison` and returns the client's result untouched.
   */
  it('requests POST /timing/poison and returns the result', async () => {
    // Arrange
    const payload = { ok: true as const, data: { armed: true } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await poisonTimingSink()

    // Assert
    expect(request).toHaveBeenCalledWith('/timing/poison', { method: 'POST' })
    expect(result).toBe(payload)
  })
})

describe('summarizeSamples', () => {
  /**
   * Empty batch.
   *
   * No samples yet (a fresh boot) must summarize to all-zero counts, not
   * `NaN` or `undefined`.
   */
  it('returns all-zero counts for an empty batch', () => {
    expect(summarizeSamples([])).toEqual({ total: 0, slow: 0, errors: 0 })
  })

  /**
   * Mixed batch.
   *
   * Counts total, slow, and error (>= 400) samples independently: a slow
   * success and a fast error must each be tallied in their own bucket.
   */
  it('tallies total, slow, and error counts independently', () => {
    // Arrange
    const samples: RequestTimingSample[] = [
      { method: 'GET', route: '/catalog/products', statusCode: 200, durationMs: 5, slow: false },
      { method: 'GET', route: '/latency', statusCode: 200, durationMs: 900, slow: true },
      { method: 'POST', route: '/failures/:kind', statusCode: 400, durationMs: 3, slow: false },
      { method: 'POST', route: '/failures/:kind', statusCode: 500, durationMs: 620, slow: true },
    ]

    // Act
    const summary = summarizeSamples(samples)

    // Assert
    expect(summary).toEqual({ total: 4, slow: 2, errors: 2 })
  })
})
