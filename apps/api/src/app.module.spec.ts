/**
 * Unit tests for AppModule wiring.
 *
 * Layer: unit.
 * Goal: verify the correlation middleware is applied to every route.
 * Mocks: a MiddlewareConsumer stub capturing apply/forRoutes.
 */

import type { MiddlewareConsumer } from '@nestjs/common'
import { describe, expect, it, jest } from '@jest/globals'

import { AppModule } from './app.module.js'
import { RequestContextMiddleware } from './core/request-context.middleware.js'

describe('AppModule', () => {
  /**
   * Global middleware application.
   *
   * The correlation middleware must be applied to the Express 5 catch-all
   * `{*splat}` so every request is assigned a correlation id.
   */
  it('applies the correlation middleware to all routes', () => {
    // Arrange
    const forRoutes = jest.fn()
    const apply = jest.fn().mockReturnValue({ forRoutes })
    const consumer = { apply } as unknown as MiddlewareConsumer

    // Act
    new AppModule().configure(consumer)

    // Assert
    expect(apply).toHaveBeenCalledWith(RequestContextMiddleware)
    expect(forRoutes).toHaveBeenCalledWith('{*splat}')
  })
})
