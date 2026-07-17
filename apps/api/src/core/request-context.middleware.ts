/**
 * @fileoverview Middleware that seeds the request correlation context. It mints
 * a fresh `crypto.randomUUID()` per request, echoes it as the `x-request-id`
 * response header so clients (and the dashboard) can pair a response with its
 * envelope, and runs the remaining pipeline inside the correlation scope.
 * @layer middleware
 *
 * The incoming `x-request-id` header, if any, is deliberately NOT trusted: the
 * id is always generated server-side, so a client cannot forge or pin a
 * correlation id. The header is echoed for observability only.
 */

import { randomUUID } from 'node:crypto'

import { Inject, Injectable } from '@nestjs/common'
import type { NestMiddleware } from '@nestjs/common'

import { RequestContextService } from './request-context.service.js'

/** Response header carrying the generated correlation id back to the client. */
const REQUEST_ID_HEADER = 'x-request-id'

/** The subset of the HTTP response this middleware writes to. */
interface CorrelatedResponse {
  /**
   * Set a response header.
   *
   * @param name - Header name.
   * @param value - Header value.
   */
  setHeader(name: string, value: string): void
}

/** Express-style continuation callback. */
type NextFunction = (error?: unknown) => void

/**
 * Seeds the AsyncLocalStorage correlation context for every request.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(@Inject(RequestContextService) private readonly context: RequestContextService) {}

  /**
   * Generate a correlation id, echo it as `x-request-id`, and run the rest of
   * the pipeline within the correlation scope.
   *
   * @param _request - The incoming request (unused; the id is server-generated).
   * @param response - The outgoing response, used to echo the id.
   * @param next - Continuation into the rest of the pipeline.
   */
  use(_request: unknown, response: CorrelatedResponse, next: NextFunction): void {
    const correlationId = randomUUID()
    response.setHeader(REQUEST_ID_HEADER, correlationId)
    this.context.run(correlationId, () => {
      next()
    })
  }
}
