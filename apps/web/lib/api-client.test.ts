/**
 * Unit tests for the envelope-aware `request<T>()` fetch wrapper.
 *
 * Layer: unit.
 * Goal: verify every branch of the discriminated `ApiResult` union: success,
 *   documented envelope errors (with and without a body `correlationId`),
 *   and transport failures (network error, non-JSON body, non-envelope error
 *   body), using a mocked global `fetch` so no real network call is made.
 * Mocks: `global.fetch`, restored after every test.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { request } from './api-client'

/** Builds a minimal mock `Response` for a given status, JSON body, and headers. */
function mockResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  } as unknown as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  /**
   * Success path.
   *
   * A 2xx JSON response resolves as `{ ok: true, data }` with the parsed
   * body passed through untouched.
   */
  it('returns ok:true with the parsed body on a successful response', async () => {
    // Arrange
    const payload = { status: 'ok', checks: [] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, payload)))

    // Act
    const result = await request<typeof payload>('/health/live')

    // Assert
    expect(result).toEqual({ ok: true, data: payload })
  })

  /**
   * Envelope error, correlationId already present.
   *
   * When the body already carries a `correlationId`, the header is never
   * consulted and the envelope passes through unchanged.
   */
  it('returns the envelope unchanged when the body already carries a correlationId', async () => {
    // Arrange
    const envelope = {
      statusCode: 409,
      code: 'BYMAX_CONFLICT',
      message: 'Demo conflict failure',
      correlationId: 'body-id',
      timestamp: '2026-01-01T00:00:00.000Z',
      path: '/failures/conflict',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(409, envelope, { 'x-request-id': 'header-id' })),
    )

    // Act
    const result = await request('/failures/conflict', { method: 'POST' })

    // Assert
    expect(result).toEqual({ ok: false, kind: 'envelope', error: envelope })
  })

  /**
   * Envelope error, correlationId backfilled from the header.
   *
   * When the body omits `correlationId`, the `x-request-id` response header
   * is copied in so the UI can always display a correlation id when one is
   * available anywhere in the response.
   */
  it('backfills correlationId from the x-request-id header when the body omits it', async () => {
    // Arrange
    const envelope = {
      statusCode: 404,
      code: 'BYMAX_NOT_FOUND',
      message: 'Product p-999999 was not found',
      timestamp: '2026-01-01T00:00:00.000Z',
      path: '/catalog/products/p-999999',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(404, envelope, { 'x-request-id': 'header-id' })),
    )

    // Act
    const result = await request('/catalog/products/p-999999')

    // Assert
    expect(result).toEqual({
      ok: false,
      kind: 'envelope',
      error: { ...envelope, correlationId: 'header-id' },
    })
  })

  /**
   * Envelope error, no header and no body correlationId.
   *
   * When neither source carries a correlation id, the envelope is returned
   * exactly as received rather than adding a `correlationId: undefined` key.
   */
  it('leaves the envelope without correlationId when neither the body nor the header carries one', async () => {
    // Arrange
    const envelope = {
      statusCode: 400,
      code: 'BYMAX_BAD_REQUEST',
      message: 'Demo bad request failure',
      timestamp: '2026-01-01T00:00:00.000Z',
      path: '/failures/bad-request',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(400, envelope)))

    // Act
    const result = await request('/failures/bad-request', { method: 'POST' })

    // Assert
    expect(result).toEqual({ ok: false, kind: 'envelope', error: envelope })
  })

  /**
   * Transport error: network failure.
   *
   * A rejected `fetch` (offline, DNS failure, CORS block) never throws out
   * of `request`; it resolves as the `transport` variant with the error's
   * message.
   */
  it('returns kind:transport with the error message when fetch rejects', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    // Act
    const result = await request('/health/live')

    // Assert
    expect(result).toEqual({ ok: false, kind: 'transport', message: 'Failed to fetch' })
  })

  /**
   * Transport error: network failure with a non-Error rejection.
   *
   * `fetch` can reject with a non-Error value in some environments; the
   * wrapper must still surface a readable message rather than crashing on
   * `error.message` of a non-Error value.
   */
  it('falls back to a generic message when fetch rejects with a non-Error value', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'))

    // Act
    const result = await request('/health/live')

    // Assert
    expect(result).toEqual({ ok: false, kind: 'transport', message: 'Network request failed' })
  })

  /**
   * Transport error: non-JSON body.
   *
   * A response whose body cannot be parsed as JSON (for example an HTML
   * error page from a misconfigured origin) surfaces as `transport`, never
   * as a thrown exception.
   */
  it('returns kind:transport when the response body is not valid JSON', async () => {
    // Arrange
    const response = {
      ok: false,
      status: 502,
      headers: new Headers(),
      json: () => Promise.reject(new Error('Unexpected token <')),
    } as unknown as Response
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    // Act
    const result = await request('/health/live')

    // Assert
    expect(result).toEqual({
      ok: false,
      kind: 'transport',
      message: 'Response was not valid JSON (status 502)',
    })
  })

  /**
   * Transport error: JSON body that is not envelope-shaped.
   *
   * A non-2xx response whose JSON body does not match the envelope contract
   * (for example a bare-bones proxy error) surfaces as `transport` rather
   * than being force-cast into an `ErrorEnvelope`.
   */
  it('returns kind:transport when a non-2xx body does not match the envelope shape', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(500, { error: 'Internal Server Error' })),
    )

    // Act
    const result = await request('/health/live')

    // Assert
    expect(result).toEqual({
      ok: false,
      kind: 'transport',
      message: 'Unexpected error response shape (status 500)',
    })
  })
})
