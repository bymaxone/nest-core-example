/**
 * @fileoverview Application root module. Loads the Zod-validated configuration
 * globally and mounts the root information controller. Core library wiring and
 * request correlation are layered on by the modules imported here.
 * @layer module
 */

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller.js'
import { validateEnv } from './config/env.schema.js'

/**
 * Root module. `ConfigModule` is global so any provider can inject the typed
 * `ConfigService<Env, true>`; `validateEnv` runs during initialization, so a
 * malformed environment aborts the bootstrap before the first request.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })],
  controllers: [AppController],
})
export class AppModule {}
