/**
 * @fileoverview Root information controller. Serves a single unauthenticated
 * `GET /` describing the service, so a fresh boot has an obvious liveness
 * target before any feature module is mounted.
 * @layer controller
 */

import { Controller, Get } from '@nestjs/common'

/** Minimal service descriptor returned by the root route. */
interface ServiceInfo {
  /** Package-level service name. */
  readonly name: string
  /** Where to find the full endpoint catalogue. */
  readonly docs: string
}

/**
 * Root controller exposing service metadata.
 */
@Controller()
export class AppController {
  /**
   * Describe the running service.
   *
   * @returns The service name and a pointer to the endpoint catalogue.
   */
  @Get()
  getInfo(): ServiceInfo {
    return {
      name: 'nest-core-example',
      docs: 'See the repository README for the full endpoint catalogue.',
    }
  }
}
