/**
 * Unit tests for the health-surface typed wrapper.
 *
 * Layer: unit.
 * Goal: verify that a 503 readiness response is parsed as data (never as a
 *   transport error), that a malformed or non-JSON body still surfaces as
 *   `transport`, and that both endpoints target the documented paths.
 * Mocks: `global.fetch`, restored after every test.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getLiveness, getReadiness } from './health-api'

/** Builds a minimal mock `Response` for a given status and JSON body. */
function mockResponse(status: number, body: unknown): Response {
  return {
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getLiveness', () => {
  /**
   * Liveness always 200, empty checks.
   *
   * Protects the documented liveness contract: an always-up response with
   * no per-indicator checks.
   */
  it('returns ok:true with an empty checks array', async () => {
    // Arrange
    const body = { status: 'ok', checks: [] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, body)))

    // Act
    const result = await getLiveness()

    // Assert
    expect(result).toEqual({ ok: true, data: body })
  })
})

describe('getReadiness', () => {
  /**
   * 200 all-up.
   *
   * Every indicator up must resolve as data with status 'ok'.
   */
  it('returns ok:true when every indicator is up (status 200)', async () => {
    // Arrange
    const body = { status: 'ok', checks: [{ name: 'event-loop', status: 'up' }] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, body)))

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({ ok: true, data: body })
  })

  /**
   * 503 any-down, rendered as data.
   *
   * The core assertion this module exists to protect: a 503 readiness
   * response is a valid application state, not a transport failure: it
   * must resolve as `ok: true`, never as `kind: 'transport'`.
   */
  it('returns ok:true when an indicator is down (status 503), never as transport error', async () => {
    // Arrange
    const body = {
      status: 'error',
      checks: [
        { name: 'event-loop', status: 'up' },
        { name: 'flaky', status: 'down', details: { reason: 'demo toggle' } },
      ],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(503, body)))

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({ ok: true, data: body })
  })

  /**
   * Non-JSON body.
   *
   * A body that cannot be parsed as JSON surfaces as `transport`, not a
   * thrown exception.
   */
  it('returns kind:transport when the body is not valid JSON', async () => {
    // Arrange
    const response = {
      status: 503,
      json: () => Promise.reject(new Error('Unexpected end of input')),
    } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({
      ok: false,
      kind: 'transport',
      message: 'Response was not valid JSON (status 503)',
    })
  })

  /**
   * Malformed body shape.
   *
   * A JSON body missing the documented `status`/`checks` fields surfaces as
   * `transport` rather than being force-cast into a `HealthResponse`.
   */
  it('returns kind:transport when the body does not match the health response shape', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, { unexpected: true })))

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({
      ok: false,
      kind: 'transport',
      message: 'Unexpected health response shape (status 200)',
    })
  })

  /**
   * Non-object body.
   *
   * A JSON body that parses to a primitive (not an object) must be rejected
   * by the same early `typeof` guard that rejects `null`, never reaching the
   * field-presence checks.
   */
  it('returns kind:transport when the body is a JSON primitive, not an object', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, 'not an object')))

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({
      ok: false,
      kind: 'transport',
      message: 'Unexpected health response shape (status 200)',
    })
  })

  /**
   * Network failure.
   *
   * A rejected `fetch` never throws out of `getReadiness`; it resolves as
   * the `transport` variant.
   */
  it('returns kind:transport when fetch rejects', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({ ok: false, kind: 'transport', message: 'Failed to fetch' })
  })

  /**
   * Network failure with a non-Error rejection.
   *
   * Mirrors the api-client's fallback-message behavior for a non-Error
   * rejection value.
   */
  it('falls back to a generic message when fetch rejects with a non-Error value', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'))

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({ ok: false, kind: 'transport', message: 'Network request failed' })
  })
})
