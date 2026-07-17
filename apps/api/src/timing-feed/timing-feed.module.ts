/**
 * @fileoverview Feature module exposing the timing-feed controller. The sink and
 * the resolved options it depends on are provided globally (by the core wiring
 * module and `BymaxCoreModule`), so this module only declares the controller.
 * @layer module
 */

import { Module } from '@nestjs/common'

import { TimingFeedController } from './timing-feed.controller.js'

/**
 * Registers the timing-feed controller.
 */
@Module({
  controllers: [TimingFeedController],
})
export class TimingFeedModule {}
