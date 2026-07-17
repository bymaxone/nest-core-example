/**
 * Unit tests for RequestContextService.
 *
 * Layer: unit.
 * Goal: verify the AsyncLocalStorage-backed correlation id is readable inside a
 * run scope and absent outside it, satisfying the library contract.
 * Mocks: none, the store is real AsyncLocalStorage.
 */

import { describe, expect, it } from '@jest/globals'

import { RequestContextService } from './request-context.service.js'

describe('RequestContextService', () => {
  /**
   * Inside a bound scope.
   *
   * The id bound by `run` must be visible to `getCorrelationId` for any code
   * executing within the callback, which is how the envelope reads it.
   */
  it('exposes the correlation id inside the run scope', () => {
    const service = new RequestContextService()

    let observed: string | undefined
    service.run('id-123', () => {
      observed = service.getCorrelationId()
    })

    expect(observed).toBe('id-123')
  })

  /**
   * Return value passthrough.
   *
   * `run` must return the callback's result so callers can wrap value-producing
   * work in a context transparently.
   */
  it('returns the callback result from run', () => {
    const service = new RequestContextService()

    const result = service.run('id-abc', () => 42)

    expect(result).toBe(42)
  })

  /**
   * Outside any scope, boundary case.
   *
   * With no active request context, `getCorrelationId` must return undefined,
   * exactly as the library contract requires so the envelope omits the field.
   */
  it('returns undefined outside a run scope', () => {
    const service = new RequestContextService()

    expect(service.getCorrelationId()).toBeUndefined()
  })
})
