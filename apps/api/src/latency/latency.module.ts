/**
 * @fileoverview Feature module exposing the Latency Lab controller. The
 * global timing interceptor and its ring-buffer sink are provided elsewhere
 * (the core wiring module), so this module only declares the controller.
 * @layer module
 */

import { Module } from '@nestjs/common'

import { LatencyController } from './latency.controller.js'

/**
 * Registers the Latency Lab controller.
 */
@Module({
  controllers: [LatencyController],
})
export class LatencyModule {}
