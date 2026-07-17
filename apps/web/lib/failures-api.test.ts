/**
 * Unit tests for the failure-injection wrapper.
 *
 * Layer: unit.
 * Goal: verify that `triggerFailure` posts to the documented `/failures/:kind`
 *   path for every registered kind and returns the client's result untouched.
 * Mocks: `./api-client#request`.
 */

import { describe, expect, it, vi } from 'vitest'

import { FAILURE_KINDS, triggerFailure } from './failures-api'
import { request } from './api-client'

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>()
  return { ...actual, request: vi.fn() }
})

describe('FAILURE_KINDS', () => {
  /**
   * Full catalog pin.
   *
   * The 16 registered kinds mirror the API's `FAILURE_REGISTRY`; a drift
   * here would silently drop a trigger card from the Errors page.
   */
  it('pins the exact 16 registered failure kinds', () => {
    expect(FAILURE_KINDS).toEqual([
      'bad-request',
      'unauthorized',
      'forbidden',
      'conflict',
      'payload-too-large',
      'unsupported-media-type',
      'unprocessable',
      'too-many-requests',
      'internal',
      'not-implemented',
      'bad-gateway',
      'service-unavailable',
      'gateway-timeout',
      'teapot',
      'variant-5xx',
      'unknown',
    ])
  })
})

describe('triggerFailure', () => {
  /**
   * Path and method, one case per kind.
   *
   * Every kind must POST to its own `/failures/:kind` path.
   */
  it.each(FAILURE_KINDS)('posts to /failures/%s', async (kind) => {
    // Arrange
    const payload = { ok: false as const, kind: 'envelope' as const, error: {} as never }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await triggerFailure(kind)

    // Assert
    expect(request).toHaveBeenCalledWith(`/failures/${kind}`, { method: 'POST' })
    expect(result).toBe(payload)
  })
})
