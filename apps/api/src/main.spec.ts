/**
 * Unit tests for the application entry point.
 *
 * Layer: unit.
 * Goal: verify createApp configures CORS and shutdown hooks, bootstrap binds
 * the configured port, and the entry guard only starts when run directly.
 * Mocks: NestFactory.create is spied so no real HTTP server is opened.
 */

import { pathToFileURL } from 'node:url'

import type { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { AppModule } from './app.module.js'
import { bootstrap, createApp, runIfMain } from './main.js'

/** A minimal INestApplication stub capturing the configuration calls. */
function buildAppMock() {
  const config = {
    get: jest.fn((key: string): unknown => (key === 'PORT' ? 3001 : 'http://localhost:3000')),
  }
  const app = {
    get: jest.fn(() => config),
    enableCors: jest.fn(),
    enableShutdownHooks: jest.fn(),
    listen: jest.fn(),
  }
  // Cast to the framework type: the stub implements only the surface the
  // entry point touches.
  return { app, appTyped: app as unknown as INestApplication, config }
}

/** Flush the microtask and immediate queues so a fire-and-forget bootstrap settles. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
}

describe('main entry point', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  /**
   * createApp configuration.
   *
   * The app must be created from AppModule, restrict CORS to WEB_ORIGIN, and
   * enable shutdown hooks, all without listening on a port.
   */
  it('creates the app with restricted CORS and shutdown hooks', async () => {
    // Arrange
    const { app, appTyped } = buildAppMock()
    const createSpy = jest.spyOn(NestFactory, 'create').mockResolvedValue(appTyped)

    // Act
    const result = await createApp()

    // Assert
    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(createSpy.mock.calls[0]?.[0]).toBe(AppModule)
    expect(app.enableCors).toHaveBeenCalledWith({ origin: 'http://localhost:3000' })
    expect(app.enableShutdownHooks).toHaveBeenCalledTimes(1)
    expect(app.listen).not.toHaveBeenCalled()
    expect(result).toBe(appTyped)
  })

  /**
   * bootstrap port binding.
   *
   * bootstrap must configure the app and then listen on the validated PORT.
   */
  it('listens on the configured port', async () => {
    // Arrange
    const { app, appTyped } = buildAppMock()
    jest.spyOn(NestFactory, 'create').mockResolvedValue(appTyped)

    // Act
    await bootstrap()

    // Assert
    expect(app.listen).toHaveBeenCalledWith(3001)
  })

  /**
   * Entry guard, direct-run branch.
   *
   * When the module URL matches the executed script path, bootstrap must fire
   * and the guard reports it started.
   */
  it('starts bootstrap when executed as the entry point', async () => {
    // Arrange
    const { appTyped } = buildAppMock()
    const createSpy = jest.spyOn(NestFactory, 'create').mockResolvedValue(appTyped)
    const entryPath = '/srv/app/dist/main.js'

    // Act
    const started = runIfMain(pathToFileURL(entryPath).href, entryPath)
    await flush()

    // Assert
    expect(started).toBe(true)
    expect(createSpy).toHaveBeenCalledTimes(1)
  })

  /**
   * Entry guard, imported branch.
   *
   * When the module URL differs from the executed script (as during tests),
   * the guard must not start the server.
   */
  it('does not start bootstrap when imported, not executed', () => {
    // Arrange
    const createSpy = jest.spyOn(NestFactory, 'create')

    // Act
    const started = runIfMain('file:///a/dist/main.js', '/b/other/entry.js')

    // Assert
    expect(started).toBe(false)
    expect(createSpy).not.toHaveBeenCalled()
  })
})
