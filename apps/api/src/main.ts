/**
 * @fileoverview Application entry point. Exposes a testable `createApp` seam
 * that configures the Nest application (restricted CORS, shutdown hooks) and a
 * `bootstrap` that binds it to the configured port. Auto-starts only when the
 * module is executed directly, so importing it from a test never opens a socket.
 * @layer config
 */

import 'reflect-metadata'

import { pathToFileURL } from 'node:url'

import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module.js'
import type { Env } from './config/env.schema.js'

/**
 * Build and configure the Nest application without binding a port.
 *
 * Kept separate from {@link bootstrap} so tests can assert the configuration
 * (CORS origin, shutdown hooks) without starting an HTTP server.
 *
 * @returns The configured, not-yet-listening application.
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule)
  const config: ConfigService<Env, true> = app.get(ConfigService)
  // CORS is restricted to the dashboard origin; a wildcard would defeat the
  // allow-list this reference app exists to demonstrate.
  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }) })
  // Forward process signals to lifecycle hooks so in-flight work can drain.
  app.enableShutdownHooks()
  return app
}

/**
 * Start the application on the configured port.
 *
 * @returns The listening application (returned so callers and tests can close it).
 */
export async function bootstrap(): Promise<INestApplication> {
  const app = await createApp()
  const config: ConfigService<Env, true> = app.get(ConfigService)
  await app.listen(config.get('PORT', { infer: true }))
  return app
}

/**
 * Start the application only when this module is the process entry point.
 *
 * @param moduleUrl - The importing module's URL (`import.meta.url`).
 * @param entryPath - The executed script path (`process.argv[1]`).
 * @returns `true` when this module is the entry point and bootstrap was kicked off.
 */
export function runIfMain(moduleUrl: string, entryPath: string | undefined): boolean {
  const isEntrypoint = entryPath !== undefined && moduleUrl === pathToFileURL(entryPath).href
  if (isEntrypoint) {
    void bootstrap()
  }
  return isEntrypoint
}

runIfMain(import.meta.url, process.argv[1])
