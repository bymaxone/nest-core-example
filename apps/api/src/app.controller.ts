/**
 * @fileoverview Root information controller. Serves a single unauthenticated
 * `GET /` describing the service, so a fresh boot has an obvious liveness
 * target before any feature module is mounted, plus a bare `GET /health`
 * probe consumed by CI orchestration (never by the dashboard).
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

/** Acknowledgement returned by the bare CI-probe route. */
interface ProbeStatus {
  /** Always `'ok'`; the route never reports a degraded state. */
  readonly status: 'ok'
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

  /**
   * Bare liveness probe consumed by the shared CI pipeline's boot-wait step
   * (`wait-on http-get://.../health`) before it runs the Playwright web
   * smoke. Distinct from the library's own `GET /health/live` and
   * `GET /health/ready` (mounted under the `./health` subpath demo): those
   * two demonstrate the library's health contract in full, including
   * indicator aggregation; this route exists only so CI orchestration has a
   * fixed, always-200 target and never depends on indicator state.
   *
   * @returns A constant `{ status: 'ok' }` body.
   */
  @Get('health')
  getProbeStatus(): ProbeStatus {
    return { status: 'ok' }
  }
}
