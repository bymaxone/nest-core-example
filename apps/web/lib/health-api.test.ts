/**
 * Unit tests for the health-surface typed wrapper.
 *
 * Layer: unit.
 * Goal: verify that a 503 readiness response is parsed as data (never as a
 *   transport error), that a malformed or non-JSON body still surfaces as
 *   `transport`, that both liveness/readiness endpoints target the
 *   documented paths, and that the toggle helpers call the shared client
 *   with the documented path and method.
 * Mocks: `global.fetch` for the liveness/readiness suites; `./api-client`
 *   for the toggle suites.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { getLiveness, getReadiness, toggleFlaky, toggleHang } from './health-api'
import { request } from './api-client'

vi.mock('./api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api-client')>()
  return { ...actual, request: vi.fn() }
})

/** Builds a minimal mock `Response` for a given status and JSON body. */
function mockResponse(status: number, body: unknown): Response {
  return {
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
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
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, body))
    vi.stubGlobal('fetch', fetchMock)

    // Act
    const result = await getLiveness()

    // Assert
    expect(result).toEqual({ ok: true, data: body })
    // Liveness targets the documented absolute URL: the configured API origin
    // plus the `/health/live` path, so neither the origin nor the path can drift.
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/health/live')
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
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, body))
    vi.stubGlobal('fetch', fetchMock)

    // Act
    const result = await getReadiness()

    // Assert
    expect(result).toEqual({ ok: true, data: body })
    // Readiness targets the configured API origin plus `/health/ready`.
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/health/ready')
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
   * Malformed checks entries.
   *
   * Each check entry is validated, not just the array: a null entry, a
   * non-object entry, a missing name, and an out-of-range status must all
   * surface as `transport` so downstream rendering never reads `check.name`
   * off a malformed value.
   */
  it('returns kind:transport when a checks entry is malformed', async () => {
    // Arrange: one array per malformed entry kind, each failing the guard.
    const malformedBodies = [
      { status: 'ok', checks: [null] },
      { status: 'ok', checks: [undefined] },
      { status: 'ok', checks: [42] },
      { status: 'ok', checks: [{ status: 'up' }] },
      { status: 'ok', checks: [{ name: 'x', status: 'sideways' }] },
    ]

    for (const body of malformedBodies) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, body)))

      // Act
      const result = await getReadiness()

      // Assert
      expect(result).toEqual({
        ok: false,
        kind: 'transport',
        message: 'Unexpected health response shape (status 200)',
      })
    }
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
   * Null and undefined bodies.
   *
   * Both must be short-circuited by the object guard and surface gracefully as
   * a transport failure. A `null` body would throw on field access if the guard
   * were skipped, and an `undefined` body would throw if the `typeof` half of
   * the guard were removed, so each pins one half of the null-object guard.
   */
  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('returns kind:transport when the body is %s', async (_label, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, body)))

    const result = await getReadiness()

    expect(result).toEqual({
      ok: false,
      kind: 'transport',
      message: 'Unexpected health response shape (status 200)',
    })
  })

  /**
   * Invalid status with an otherwise-valid body.
   *
   * A body with a well-formed `checks` array but a `status` outside
   * `'ok' | 'error'` must still be rejected, proving the status membership
   * check is a real gate rather than always-true.
   */
  it('returns kind:transport when status is outside the allowed set', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(200, { status: 'weird', checks: [] })),
    )

    const result = await getReadiness()

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

describe('toggleFlaky', () => {
  /**
   * Path and method, one case per status.
   *
   * Each status posts to its own query-string value and returns the
   * client's result untouched.
   */
  it.each(['up', 'down'] as const)('posts status=%s to /health-demo/flaky', async (status) => {
    // Arrange
    const payload = { ok: true as const, data: { name: 'flaky', state: status } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await toggleFlaky(status)

    // Assert
    expect(request).toHaveBeenCalledWith(`/health-demo/flaky?status=${status}`, {
      method: 'POST',
    })
    expect(result).toBe(payload)
  })
})

describe('toggleHang', () => {
  /**
   * Path and method, one case per boolean.
   *
   * `enabled` is serialized as the literal strings `true`/`false`, matching
   * the API's strict `enum(['true', 'false'])` schema (no permissive
   * coercion).
   */
  it.each([true, false])('posts enabled=%s to /health-demo/hang', async (enabled) => {
    // Arrange
    const payload = { ok: true as const, data: { name: 'hanging', state: enabled } }
    vi.mocked(request).mockResolvedValue(payload)

    // Act
    const result = await toggleHang(enabled)

    // Assert
    expect(request).toHaveBeenCalledWith(`/health-demo/hang?enabled=${String(enabled)}`, {
      method: 'POST',
    })
    expect(result).toBe(payload)
  })
})
