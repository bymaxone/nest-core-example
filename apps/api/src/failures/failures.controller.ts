/**
 * @fileoverview REST surface for the failure-injection demo: `POST
 * /failures/:kind` always throws, one trigger per row of the library's
 * BYMAX_* error-code catalog, so every derivation can be reproduced on
 * demand.
 * @layer controller
 */

import { Controller, Inject, Param, Post } from '@nestjs/common'

import { FailuresService } from './failures.service.js'

/**
 * Failure-injection controller. Every route always throws; there is no
 * successful response.
 */
@Controller('failures')
export class FailuresController {
  constructor(@Inject(FailuresService) private readonly failures: FailuresService) {}

  /**
   * Trigger the failure registered under the `kind` route parameter.
   *
   * @param kind - The failure kind to trigger.
   * @throws Always; see {@link FailuresService.trigger}.
   */
  @Post(':kind')
  trigger(@Param('kind') kind: string): never {
    return this.failures.trigger(kind)
  }
}
