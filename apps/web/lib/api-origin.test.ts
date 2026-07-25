/**
 * Unit tests for the `api-origin` module.
 *
 * Layer: unit.
 * Goal: verify the resolution contract `next.config.mjs` builds the CSP from —
 *   absent takes the default, anything present must be a valid absolute URL —
 *   and in particular that an empty string throws instead of resolving to one.
 *   An empty origin interpolates into `connect-src 'self' `, a policy that
 *   names no API origin and silently blocks every request while the page still
 *   renders, which is the exact failure this module exists to prevent.
 * Mocks: none.
 */

import { describe, expect, it } from 'vitest'

import { DEFAULT_API_ORIGIN, isSupportedApiUrl, resolveApiOrigin } from './api-origin.mjs'

describe('isSupportedApiUrl', () => {
  /**
   * Accepted schemes.
   *
   * Only `http:` and `https:` are fetchable by the browser and meaningful as a
   * CSP source, so only those may pass.
   */
  it('accepts absolute http and https URLs', () => {
    expect(isSupportedApiUrl('http://localhost:3001')).toBe(true)
    expect(isSupportedApiUrl('https://api.example.com')).toBe(true)
  })

  /**
   * Rejected input.
   *
   * `javascript:` and `file:` parse as URLs but have a `"null"` origin, and a
   * non-string or unparseable value is not a URL at all.
   */
  it('rejects non-http schemes, unparseable strings, and non-strings', () => {
    expect(isSupportedApiUrl('javascript:alert(1)')).toBe(false)
    expect(isSupportedApiUrl('file:///etc/passwd')).toBe(false)
    expect(isSupportedApiUrl('not-a-url')).toBe(false)
    expect(isSupportedApiUrl('')).toBe(false)
    expect(isSupportedApiUrl(undefined)).toBe(false)
  })
})

describe('resolveApiOrigin', () => {
  /**
   * Absent value.
   *
   * A fresh checkout has no env file, so `undefined` must take the shared
   * development default rather than throwing.
   */
  it('returns the shared default when the value is absent', () => {
    expect(resolveApiOrigin(undefined)).toBe(DEFAULT_API_ORIGIN)
  })

  /**
   * Valid override.
   *
   * A well-formed absolute URL resolves to its origin, so a deployment can
   * point the dashboard at any API host.
   */
  it('returns the origin of a valid absolute URL', () => {
    expect(resolveApiOrigin('https://api.example.com')).toBe('https://api.example.com')
  })

  /**
   * CSP directive injection.
   *
   * `;` is legal in a URL path and is also the CSP directive separator, so a
   * raw value like `http://host/;script-src *` would close `connect-src` and
   * append a directive. Reducing to the origin drops the path, so nothing can
   * escape the directive it sits in.
   */
  it('strips a path so a semicolon cannot inject another CSP directive', () => {
    const resolved = resolveApiOrigin('http://evil.example.com/;script-src *')

    expect(resolved).toBe('http://evil.example.com')
    expect(resolved).not.toContain(';')
  })

  /**
   * Empty string.
   *
   * `NEXT_PUBLIC_API_URL=` in an env file parses to `''`, which nullish
   * coalescing would pass straight through into the CSP. It must throw.
   */
  it('throws on an empty string rather than resolving to one', () => {
    expect(() => resolveApiOrigin('')).toThrow('NEXT_PUBLIC_API_URL')
  })

  /**
   * Malformed value.
   *
   * A non-URL string would become a CSP source the browser cannot match,
   * blocking requests just as silently as an empty one.
   */
  it('throws naming the variable when the value is not a valid URL', () => {
    expect(() => resolveApiOrigin('not-a-url')).toThrow('NEXT_PUBLIC_API_URL')
  })

  /**
   * Unusable scheme.
   *
   * A `javascript:` or `file:` URL parses but has a `"null"` origin, which no
   * request can match; it must fail at startup rather than reach the policy.
   */
  it('throws on a URL whose scheme has no usable origin', () => {
    expect(() => resolveApiOrigin('javascript:alert(1)')).toThrow('NEXT_PUBLIC_API_URL')
    expect(() => resolveApiOrigin('file:///etc/passwd')).toThrow('NEXT_PUBLIC_API_URL')
  })
})
