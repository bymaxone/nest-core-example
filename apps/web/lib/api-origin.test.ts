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

import { DEFAULT_API_ORIGIN, resolveApiOrigin } from './api-origin.mjs'

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
   * A well-formed absolute URL passes through untouched, so a deployment can
   * point the dashboard at any API origin.
   */
  it('returns a valid absolute URL unchanged', () => {
    expect(resolveApiOrigin('https://api.example.com')).toBe('https://api.example.com')
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
})
