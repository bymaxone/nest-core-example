/**
 * @fileoverview Resolves a failure kind to its registered trigger and invokes
 * it. An unrecognized kind collapses to 404 rather than executing anything,
 * keeping the demo surface a pure error-catalog exerciser.
 * @layer service
 */

import { Injectable, NotFoundException } from '@nestjs/common'

import { FAILURE_REGISTRY, isFailureKind } from './failure-registry.js'

/**
 * Resolves and invokes the demo failure registry.
 */
@Injectable()
export class FailuresService {
  /**
   * Trigger the failure registered under `kind`.
   *
   * @param kind - The raw route parameter naming the failure to trigger.
   * @throws NotFoundException when `kind` is not a registered failure kind.
   * @throws Error the registered trigger throws (an `HttpException` subclass
   *   for every registered kind).
   */
  trigger(kind: string): never {
    if (!isFailureKind(kind)) {
      throw new NotFoundException(`Unknown failure kind: ${kind}`)
    }
    return FAILURE_REGISTRY[kind]()
  }
}
