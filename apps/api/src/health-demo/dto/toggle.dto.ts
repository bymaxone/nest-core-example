/**
 * @fileoverview Zod schemas and inferred types for the health demo toggle
 * endpoints. `flaky` accepts a strict `up | down` status; `hang` accepts a
 * strict boolean-from-string `enabled` flag. Invalid values are rejected (not
 * clamped) so a mistyped toggle surfaces as a validation envelope.
 * @layer dto
 */

import { z } from 'zod'

/**
 * Validated shape accepted by `POST /health-demo/flaky`. `status` selects the
 * readiness the flaky indicator reports next.
 */
export const flakyToggleSchema = z.object({
  status: z.enum(['up', 'down']),
})

/** Inferred input type for {@link flakyToggleSchema}. */
export type FlakyToggleQuery = z.infer<typeof flakyToggleSchema>

/**
 * Validated shape accepted by `POST /health-demo/hang`. `enabled` arms or
 * disarms the hanging indicator; env-style strings are the only accepted form,
 * so a permissive coercion never treats `"false"` as truthy.
 */
export const hangToggleSchema = z.object({
  enabled: z.enum(['true', 'false']).transform((value) => value === 'true'),
})

/** Inferred output type for {@link hangToggleSchema}. */
export type HangToggleQuery = z.infer<typeof hangToggleSchema>
