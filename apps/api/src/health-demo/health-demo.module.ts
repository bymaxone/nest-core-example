/**
 * @fileoverview Feature module for the health demonstration. It owns the shared
 * toggle state services and the flaky and hanging indicators, exporting them so
 * the core wiring module can alias them onto the library's
 * `BYMAX_HEALTH_INDICATORS` multi-token.
 * @layer module
 */

import { Module } from '@nestjs/common'

import { HealthDemoController } from './health-demo.controller.js'
import { FlakyHealthIndicator } from './flaky.indicator.js'
import { FlakyStateService } from './flaky-state.service.js'
import { HangStateService } from './hang-state.service.js'
import { HangingHealthIndicator } from './hanging.indicator.js'

/**
 * Provides the demo indicator state, the flaky and hanging indicators, and the
 * toggle controller that mutates their shared state. The event-loop indicator
 * is stateless and bound directly by the core wiring module, so it is not
 * declared here.
 */
@Module({
  controllers: [HealthDemoController],
  providers: [FlakyStateService, HangStateService, FlakyHealthIndicator, HangingHealthIndicator],
  exports: [FlakyStateService, HangStateService, FlakyHealthIndicator, HangingHealthIndicator],
})
export class HealthDemoModule {}
