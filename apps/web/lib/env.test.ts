/**
 * Unit tests for the `env` module.
 *
 * Layer: unit.
 * Goal: verify the env module validates and freezes a valid configuration,
 *   applies the shared development default when a variable is absent, and
 *   throws a readable, prefixed error naming every offending variable when a
 *   value is present but malformed. The module is imported dynamically (after
 *   mutating `process.env`) so each test controls the Zod parse outcome.
 * Mocks: `process.env`, restored after every test via `vi.resetModules()`.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

/** Original env snapshot, restored after every test. */
const originalEnv = { ...process.env }

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key]
  }
  Object.assign(process.env, originalEnv)
  vi.resetModules()
})

describe('env', () => {
  /**
   * Valid configuration.
   *
   * A well-formed `NEXT_PUBLIC_API_URL` must produce a frozen object
   * exposing that exact value.
   */
  it('exports a frozen object with the validated API URL', async () => {
    // Arrange
    process.env['NEXT_PUBLIC_API_URL'] = 'http://localhost:3001'

    // Act
    const { env } = await import('./env')

    // Assert
    expect(Object.isFrozen(env)).toBe(true)
    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:3001')
  })

  /**
   * Absent variable.
   *
   * A fresh checkout has no env file, so an absent `NEXT_PUBLIC_API_URL` must
   * fall back to the shared development default rather than throwing. The
   * default must be the very constant `next.config.mjs` splices into the CSP
   * `connect-src`: if the two drift, the dashboard renders while the browser
   * blocks every API call.
   */
  it('falls back to the shared default API origin when the variable is absent', async () => {
    // Arrange
    delete process.env['NEXT_PUBLIC_API_URL']

    // Act
    const { env } = await import('./env')
    const { DEFAULT_API_ORIGIN } = await import('./api-origin.mjs')

    // Assert
    expect(env.NEXT_PUBLIC_API_URL).toBe(DEFAULT_API_ORIGIN)
  })

  /**
   * Malformed variable.
   *
   * An absent value is a fresh checkout, but a value that is present and not
   * a URL is a mistake: it must still throw at import time, with the
   * documented `Invalid web env:` prefix and the offending field named.
   */
  it('throws naming the field when the API URL is present but not a valid URL', async () => {
    // Arrange
    process.env['NEXT_PUBLIC_API_URL'] = 'not-a-url'

    // Act & Assert
    await expect(import('./env')).rejects.toThrow('Invalid web env:')
    await expect(import('./env')).rejects.toThrow('NEXT_PUBLIC_API_URL')
  })
})
