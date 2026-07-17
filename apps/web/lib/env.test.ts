/**
 * Unit tests for the `env` module.
 *
 * Layer: unit.
 * Goal: verify the env module validates and freezes a valid configuration,
 *   and throws a readable, prefixed error listing every offending variable
 *   when validation fails. The module is imported dynamically (after
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
   * Missing required variable.
   *
   * When `NEXT_PUBLIC_API_URL` is absent, the module must throw at import
   * time with the documented `Invalid web env:` prefix rather than exporting
   * a broken config the rest of the app would silently misuse.
   */
  it('throws with the "Invalid web env:" prefix when the API URL is missing', async () => {
    // Arrange
    delete process.env['NEXT_PUBLIC_API_URL']

    // Act & Assert
    await expect(import('./env')).rejects.toThrow('Invalid web env:')
  })

  /**
   * Malformed variable.
   *
   * A non-URL string must fail the same way as a missing value, naming the
   * offending field in the error.
   */
  it('throws naming the field when the API URL is not a valid URL', async () => {
    // Arrange
    process.env['NEXT_PUBLIC_API_URL'] = 'not-a-url'

    // Act & Assert
    await expect(import('./env')).rejects.toThrow('NEXT_PUBLIC_API_URL')
  })
})
