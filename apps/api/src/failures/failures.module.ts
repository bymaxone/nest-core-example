/**
 * @fileoverview Feature module wiring the failure-injection controller and
 * service together.
 * @layer module
 */

import { Module } from '@nestjs/common'

import { FailuresController } from './failures.controller.js'
import { FailuresService } from './failures.service.js'

/**
 * Registers the failure-injection controller and service.
 */
@Module({
  controllers: [FailuresController],
  providers: [FailuresService],
})
export class FailuresModule {}
