/**
 * @fileoverview Domain-specific HTTP exceptions carrying an explicit
 * machine-readable `code`. The library's exception filter passes an explicit
 * `code` field through verbatim instead of deriving one from the HTTP status,
 * so these classes prove that passthrough end to end. Domain codes never use
 * the reserved `BYMAX_` prefix, which is reserved for the library's own
 * status-derived catalog.
 * @layer common
 */

import { HttpException, HttpStatus } from '@nestjs/common'

/** Structured response body carried by a domain error. */
interface DomainErrorResponse {
  /** Stable machine-readable code, distinct from the library's `BYMAX_*` catalog. */
  readonly code: string
  /** Human-readable, end-user-safe message. */
  readonly message: string
}

/**
 * Thrown when a seasonal product is looked up outside of its selling window.
 *
 * Carries the explicit code `CATALOG_OUT_OF_SEASON`, which the exception
 * filter passes through verbatim rather than deriving `BYMAX_CONFLICT` from
 * the HTTP 409 status.
 */
export class OutOfSeasonError extends HttpException {
  /**
   * @param productId - The id of the seasonal product that is out of season.
   */
  constructor(productId: string) {
    const response: DomainErrorResponse = {
      code: 'CATALOG_OUT_OF_SEASON',
      message: `Product ${productId} is currently out of season`,
    }
    super(response, HttpStatus.CONFLICT)
  }
}
