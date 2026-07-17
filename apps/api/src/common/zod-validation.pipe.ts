/**
 * @fileoverview A NestJS pipe that validates and parses a request payload with a
 * Zod schema. On failure it throws a `BadRequestException` whose response carries
 * one structured issue per violation in a `message` array; the library's
 * exception filter recognizes that shape and maps it to `BYMAX_VALIDATION_FAILED`,
 * so the pipe never formats an envelope itself.
 * @layer pipe
 */

import { BadRequestException } from '@nestjs/common'
import type { PipeTransform } from '@nestjs/common'
import type { ZodType } from 'zod'

/** One structured validation issue attached to the error envelope details. */
interface ValidationIssue {
  /** Dotted path to the offending field, empty for the payload root. */
  readonly path: string
  /** Human-readable description of the violation. */
  readonly message: string
}

/**
 * Validate a payload against a Zod schema, returning the parsed value or
 * throwing a validation error.
 *
 * Used per route as an instance, `@Body(new ZodValidationPipe(schema))`, so the
 * schema is supplied at the call site rather than injected.
 */
export class ZodValidationPipe<TOutput> implements PipeTransform<unknown, TOutput> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  /**
   * Parse and validate the incoming value.
   *
   * @param value - The raw, unvalidated payload.
   * @returns The parsed value typed to the schema output.
   * @throws BadRequestException with a structured `message` array when validation fails.
   */
  transform(value: unknown): TOutput {
    const result = this.schema.safeParse(value)
    if (result.success) {
      return result.data
    }
    const message: ValidationIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    throw new BadRequestException({ message })
  }
}
