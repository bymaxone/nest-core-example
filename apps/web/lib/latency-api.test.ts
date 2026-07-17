/**
 * Unit tests for the artificial-delay wrapper.
 *
 * Layer: unit.
 * Goal: verify the query string is built correctly with and without the
 *   poison flag, and that the client's result passes through unchanged.
 * Mocks: `./api-client#request`.
 */

import { describe, expect, it, vi } from 'vitest'

import { fireDelay } from './latency-api'
import { request } from './api-client'

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>()
  return { ...actual, request: vi.fn() }
})

describe('fireDelay', () => {
  /**
   * Default call, no poison.
   *
   * Omitting `poison` must not add the query param at all.
   */
  it('requests GET /latency?ms= without a poison param by default', async () => {
    // Arrange
    const payload = {
      ok: true as const,
      data: { requestedMs: 300, elapsedMs: 301, poisoned: false },
    }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await fireDelay(300)

    // Assert
    expect(request).toHaveBeenCalledWith('/latency?ms=300')
    expect(result).toBe(payload)
  })

  /**
   * Poison armed.
   *
   * `poison: true` appends `&poison=true` to the query string.
   */
  it('appends poison=true when poison is requested', async () => {
    // Arrange
    const payload = { ok: true as const, data: { requestedMs: 0, elapsedMs: 1, poisoned: true } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await fireDelay(0, true)

    // Assert
    expect(request).toHaveBeenCalledWith('/latency?ms=0&poison=true')
    expect(result).toBe(payload)
  })
})
