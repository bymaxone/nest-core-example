/**
 * Integration tests for the /metrics scrape content.
 *
 * Layer: integration (real Nest testing module with metrics and timing enabled,
 * driven through supertest).
 * Goal: prove the scrape carries the default HTTP metrics with bounded labels,
 * the configured default label, a process metric, and the custom
 * catalog_lookups_total counter that grows as the demo endpoint fires.
 * Mocks: none; the library's real prom-client registry backs the endpoint.
 */

import type { Server } from 'node:http'

import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { BymaxCoreModule } from '@bymax-one/nest-core'
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'

import { MetricsDemoModule } from './metrics-demo.module.js'

/**
 * Extract the sorted label keys of a metric's first sample line.
 *
 * @param scrape - The full Prometheus scrape text.
 * @param metric - The metric name whose sample labels to read.
 * @returns The metric's label keys, sorted.
 */
function sampleLabelKeys(scrape: string, metric: string): string[] {
  const line = scrape.split('\n').find((row) => row.startsWith(`${metric}{`))
  if (line === undefined) {
    throw new Error(`No labeled sample line for ${metric}`)
  }
  const inside = line.slice(line.indexOf('{') + 1, line.indexOf('}'))
  return inside
    .split(',')
    .map((pair) => pair.split('=')[0]?.trim() ?? '')
    .sort()
}

/**
 * Read the numeric value of a metric's single labeled sample line.
 *
 * @param scrape - The full Prometheus scrape text.
 * @param metric - The metric name to read.
 * @returns The parsed value, or 0 when the metric is absent.
 */
function sampleValue(scrape: string, metric: string): number {
  const line = scrape.split('\n').find((row) => row.startsWith(`${metric}{`))
  if (line === undefined) {
    return 0
  }
  return Number(line.slice(line.lastIndexOf(' ') + 1))
}

describe('metrics scrape', () => {
  let app: INestApplication
  let httpServer: Server

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        BymaxCoreModule.forRoot({
          metrics: { enabled: true, defaultLabels: { app: 'nest-core-example' } },
          timing: { enabled: true },
        }),
        MetricsDemoModule,
      ],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    httpServer = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  /**
   * Default HTTP + process metrics with bounded and default labels.
   *
   * After one request flows through the timing bridge, the scrape must carry
   * both default HTTP metrics, a process metric, the `app` default label on
   * every series, and the HTTP counter's labels bounded to exactly method,
   * route, status_code (plus the app default), never a high-cardinality id.
   */
  it('serves default HTTP metrics with bounded labels, the default label, and process metrics', async () => {
    await request(httpServer).post('/metrics-demo/lookup')

    const scrape = await request(httpServer).get('/metrics')

    expect(scrape.status).toBe(200)
    const text = scrape.text
    expect(text).toContain('http_requests_total')
    expect(text).toContain('http_request_duration_seconds')
    expect(text).toContain('app="nest-core-example"')
    expect(/^process_/m.test(text)).toBe(true)
    expect(sampleLabelKeys(text, 'http_requests_total')).toEqual([
      'app',
      'method',
      'route',
      'status_code',
    ])
  })

  /**
   * Custom counter growth.
   *
   * The custom `catalog_lookups_total` must increase by exactly one each time
   * the demo endpoint fires, and it must carry the same `app` default label as
   * every other series.
   */
  it('grows catalog_lookups_total after the demo endpoint fires', async () => {
    const before = sampleValue(
      (await request(httpServer).get('/metrics')).text,
      'catalog_lookups_total',
    )

    await request(httpServer).post('/metrics-demo/lookup')

    const scrape = (await request(httpServer).get('/metrics')).text
    expect(sampleValue(scrape, 'catalog_lookups_total')).toBe(before + 1)
    expect(/catalog_lookups_total\{[^}]*app="nest-core-example"[^}]*\}/.test(scrape)).toBe(true)
  })
})
