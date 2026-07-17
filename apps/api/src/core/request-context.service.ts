/**
 * @fileoverview The example's implementation of the library's
 * `ICorrelationIdProvider` contract over `AsyncLocalStorage`. A per-request
 * store holds the correlation id so the error envelope, and any other consumer
 * of `BYMAX_CORRELATION_PROVIDER`, can stamp it without threading it through
 * every call.
 * @layer service
 *
 * Production pairing: a real Bymax service typically satisfies the same
 * `BYMAX_CORRELATION_PROVIDER` token with the AsyncLocalStorage log context of
 * `@bymax-one/nest-logger` via a single `useExisting` alias. This example ships
 * its own minimal provider so the contract stands alone and is visible in full.
 */

import { AsyncLocalStorage } from 'node:async_hooks'

import { Injectable } from '@nestjs/common'
import type { ICorrelationIdProvider } from '@bymax-one/nest-core'

/** The per-request values carried by the AsyncLocalStorage store. */
interface RequestContextStore {
  /** Correlation id for the in-flight request. */
  readonly correlationId: string
}

/**
 * AsyncLocalStorage-backed correlation provider.
 */
@Injectable()
export class RequestContextService implements ICorrelationIdProvider {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>()

  /**
   * Run a callback inside a fresh context bound to a correlation id.
   *
   * Everything awaited transitively inside the callback observes the same id
   * through {@link getCorrelationId}, which is how a middleware seeds the id for
   * the whole request lifecycle.
   *
   * @param correlationId - The id to bind for the duration of the callback.
   * @param callback - The work to run within the bound context.
   * @returns Whatever the callback returns.
   */
  run<T>(correlationId: string, callback: () => T): T {
    return this.storage.run({ correlationId }, callback)
  }

  /**
   * Read the correlation id bound to the current execution context.
   *
   * @returns The bound correlation id, or `undefined` when called outside a
   *   request scope (satisfying the library contract).
   */
  getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId
  }
}
