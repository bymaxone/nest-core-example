/**
 * @fileoverview HTTP test helper: a `supertest` agent bound to the booted Nest
 * server. Every e2e spec drives the real app over HTTP against
 * `app.getHttpServer()`, the genuine Express server with the production
 * global exception filter and timing interceptor active, so status codes and
 * envelope shapes are production-accurate, never mocked.
 * @layer test-helper
 */

import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import type { Server } from 'node:http'

/**
 * Bind a `supertest` agent to the application's live HTTP server.
 *
 * @param app - The booted Nest application (already listening).
 * @returns A `supertest` test agent; chain `.get('/health/live')`, `.post(...)`, etc.
 */
export function httpAgent(app: INestApplication): ReturnType<typeof request.agent> {
  const server: Server = app.getHttpServer()
  return request.agent(server)
}
