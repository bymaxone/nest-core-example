/**
 * @fileoverview Application root module. Loads the Zod-validated configuration,
 * registers `BymaxCoreModule` from that configuration, binds the example's
 * implementations onto the library tokens, seeds per-request correlation, and
 * mounts the feature controllers.
 * @layer module
 */

import { Module } from '@nestjs/common'
import type { MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BymaxCoreModule } from '@bymax-one/nest-core'

import { AppController } from './app.controller.js'
import { CatalogModule } from './catalog/catalog.module.js'
import { validateEnv } from './config/env.schema.js'
import { buildCoreOptions } from './core/core.config.js'
import { CoreWiringModule } from './core/core.module.js'
import { RequestContextMiddleware } from './core/request-context.middleware.js'
import { TimingFeedModule } from './timing-feed/timing-feed.module.js'

/**
 * Root module. `ConfigModule` validates the environment (aborting a bad boot),
 * `BymaxCoreModule.forRootAsync` resolves the library options from it, and
 * `CoreWiringModule` binds the correlation provider and timing sink.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    BymaxCoreModule.forRootAsync({
      // `isGlobal` is a synchronous module extra decided by the builder at the
      // call site; a value returned from `useFactory` would have no effect.
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: buildCoreOptions,
    }),
    CoreWiringModule,
    TimingFeedModule,
    CatalogModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  /**
   * Apply the correlation middleware to every route.
   *
   * The Express 5 named wildcard `{*splat}` matches all paths including the
   * root, so every request is assigned a correlation id before it reaches a
   * handler.
   *
   * @param consumer - The middleware consumer to configure.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('{*splat}')
  }
}
