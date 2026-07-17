/**
 * @fileoverview Application root module. Loads the Zod-validated configuration
 * globally, mounts the root information controller, and seeds the per-request
 * correlation context for every route through the request-context middleware.
 * @layer module
 */

import { Module } from '@nestjs/common'
import type { MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller.js'
import { validateEnv } from './config/env.schema.js'
import { RequestContextMiddleware } from './core/request-context.middleware.js'
import { RequestContextService } from './core/request-context.service.js'

/**
 * Root module. `ConfigModule` is global so any provider can inject the typed
 * `ConfigService<Env, true>`; `validateEnv` runs during initialization, so a
 * malformed environment aborts the bootstrap before the first request.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
  controllers: [AppController],
  providers: [RequestContextService],
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
