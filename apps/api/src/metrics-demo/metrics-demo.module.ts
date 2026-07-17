/**
 * @fileoverview Feature module wiring the metrics demo controller and service.
 * It depends only on the globally exported `BYMAX_METRICS_REGISTRY` the library
 * binds when metrics are enabled, so it adds no infrastructure of its own.
 * @layer module
 */

import { Module } from '@nestjs/common'

import { MetricsDemoController } from './metrics-demo.controller.js'
import { MetricsDemoService } from './metrics-demo.service.js'

/**
 * Registers the metrics demo controller and its counter-owning service.
 */
@Module({
  controllers: [MetricsDemoController],
  providers: [MetricsDemoService],
})
export class MetricsDemoModule {}
