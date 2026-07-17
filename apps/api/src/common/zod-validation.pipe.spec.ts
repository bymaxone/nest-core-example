/**
 * Unit tests for ZodValidationPipe.
 *
 * Layer: unit.
 * Goal: verify valid payloads pass through parsed and invalid payloads throw a
 * BadRequestException carrying the array-shaped message the library filter maps
 * to BYMAX_VALIDATION_FAILED.
 * Mocks: none, a real Zod schema drives the pipe.
 */

import { BadRequestException } from '@nestjs/common'
import { describe, expect, it } from '@jest/globals'
import { z } from 'zod'

import { ZodValidationPipe } from './zod-validation.pipe.js'

const schema = z.object({ name: z.string(), age: z.number() })

describe('ZodValidationPipe', () => {
  /**
   * Valid payload passthrough.
   *
   * A payload that satisfies the schema must be returned parsed and typed.
   */
  it('returns the parsed value for a valid payload', () => {
    const pipe = new ZodValidationPipe(schema)

    expect(pipe.transform({ name: 'ada', age: 36 })).toEqual({ name: 'ada', age: 36 })
  })

  /**
   * Invalid payload, structured rejection.
   *
   * Failures must throw a BadRequestException whose response `message` is an
   * array with one entry per violation, the exact shape the library filter maps
   * to BYMAX_VALIDATION_FAILED.
   */
  it('throws a BadRequestException with one issue per violation', () => {
    // Arrange
    const pipe = new ZodValidationPipe(schema)
    let error: BadRequestException | undefined

    // Act
    try {
      pipe.transform({ name: 42 })
    } catch (caught) {
      error = caught as BadRequestException
    }

    // Assert
    expect(error).toBeInstanceOf(BadRequestException)
    const response = error?.getResponse() as { message: Array<{ path: string; message: string }> }
    expect(Array.isArray(response.message)).toBe(true)
    const paths = response.message.map((issue) => issue.path)
    expect(paths).toContain('name')
    expect(paths).toContain('age')
  })

  /**
   * Nested field path joining.
   *
   * A violation on a nested field must report its full dotted path
   * (`address.city`), proving the issue path segments are joined with a dot
   * rather than concatenated, which is what the dashboard renders per issue.
   */
  it('joins nested field paths with a dot separator', () => {
    const nested = z.object({ address: z.object({ city: z.string() }) })
    const pipe = new ZodValidationPipe(nested)
    let error: BadRequestException | undefined

    try {
      pipe.transform({ address: { city: 42 } })
    } catch (caught) {
      error = caught as BadRequestException
    }

    const response = error?.getResponse() as { message: Array<{ path: string }> }
    expect(response.message.map((issue) => issue.path)).toContain('address.city')
  })
})
