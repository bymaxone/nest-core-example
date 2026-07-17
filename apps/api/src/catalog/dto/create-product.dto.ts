/**
 * @fileoverview Zod schema and inferred type for the catalog create endpoint.
 * Consumed through `ZodValidationPipe`, whose rejection path the library's
 * exception filter maps to the `BYMAX_VALIDATION_FAILED` envelope shape.
 * @layer dto
 */

import { z } from 'zod'

/** Validated shape accepted by `POST /catalog/products`. */
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  priceCents: z.number().int().nonnegative(),
})

/** Inferred input type for {@link createProductSchema}. */
export type CreateProductInput = z.infer<typeof createProductSchema>
