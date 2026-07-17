/**
 * Unit tests for RequestContextMiddleware.
 *
 * Layer: unit.
 * Goal: verify the middleware echoes a generated uuid as x-request-id, runs the
 * continuation inside the correlation scope, and mints a unique id per request.
 * Mocks: a minimal response with setHeader and a next spy.
 */

import { describe, expect, it, jest } from '@jest/globals'

import { RequestContextMiddleware } from './request-context.middleware.js'
import { RequestContextService } from './request-context.service.js'

/** RFC 4122 v4 uuid shape, as produced by node:crypto randomUUID. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('RequestContextMiddleware', () => {
  /**
   * Header echo plus in-scope correlation.
   *
   * The middleware must set x-request-id to a v4 uuid and make that same id
   * readable through the service while the continuation runs.
   */
  it('echoes a uuid header and binds it for the continuation', () => {
    // Arrange
    const service = new RequestContextService()
    const middleware = new RequestContextMiddleware(service)
    const setHeader = jest.fn()
    let idDuringNext: string | undefined
    const next = jest.fn(() => {
      idDuringNext = service.getCorrelationId()
    })

    // Act
    middleware.use({}, { setHeader }, next)

    // Assert
    expect(next).toHaveBeenCalledTimes(1)
    const [headerName, headerValue] = setHeader.mock.calls[0] as [string, string]
    expect(headerName).toBe('x-request-id')
    expect(headerValue).toMatch(UUID_V4)
    expect(idDuringNext).toBe(headerValue)
    // The scope closes when use returns, so no id leaks afterward.
    expect(service.getCorrelationId()).toBeUndefined()
  })

  /**
   * Uniqueness across requests.
   *
   * Each request must get its own id so correlation never bleeds between
   * concurrent or sequential requests.
   */
  it('generates a unique id per request', () => {
    // Arrange
    const service = new RequestContextService()
    const middleware = new RequestContextMiddleware(service)
    const first = jest.fn()
    const second = jest.fn()
    const firstHeader = jest.fn()
    const secondHeader = jest.fn()

    // Act
    middleware.use({}, { setHeader: firstHeader }, first)
    middleware.use({}, { setHeader: secondHeader }, second)

    // Assert
    const firstId = (firstHeader.mock.calls[0] as [string, string])[1]
    const secondId = (secondHeader.mock.calls[0] as [string, string])[1]
    expect(firstId).not.toBe(secondId)
  })
})
