/**
 * @fileoverview Demo endpoint that drives the custom application metric.
 * `POST /metrics-demo/lookup` increments `catalog_lookups_total` on the injected
 * registry and returns its running total, so the Metrics View can watch a
 * custom counter grow alongside the library's default HTTP and process metrics.
 * @layer controller
 */

import { Controller, Inject, Post } from '@nestjs/common'

import type { LookupResult } from './metrics-demo.service.js'
import { MetricsDemoService } from './metrics-demo.service.js'

/**
 * Increments the custom catalog-lookup counter on demand.
 */
@Controller('metrics-demo')
export class MetricsDemoController {
  /**
   * @param service - Owns the `catalog_lookups_total` counter.
   */
  constructor(@Inject(MetricsDemoService) private readonly service: MetricsDemoService) {}

  /**
   * Record one catalog lookup and report the counter's new total.
   *
   * @returns The counter name and its total after the increment.
   */
  @Post('lookup')
  lookup(): Promise<LookupResult> {
    return this.service.recordLookup()
  }
}
