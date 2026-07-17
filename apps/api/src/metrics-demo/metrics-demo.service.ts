/**
 * @fileoverview Registers and increments a custom application counter against
 * the library's injected `BYMAX_METRICS_REGISTRY`. `prom-client` is never
 * imported at the top level: the `Counter` constructor is obtained lazily inside
 * the first lookup so the optional peer stays unloaded until metrics are
 * actually exercised, and the registry is the only path to the metric.
 * @layer service
 */

import { Inject, Injectable } from '@nestjs/common'
import { BYMAX_METRICS_REGISTRY } from '@bymax-one/nest-core'

/** The `prom-client` module type, referenced without a static import. */
type PromClientModule = typeof import('prom-client')

/** The dedicated metrics registry the library injects when metrics are enabled. */
type MetricsRegistry = InstanceType<PromClientModule['Registry']>

/** The catalog-lookup counter registered against the injected registry. */
type LookupCounter = InstanceType<PromClientModule['Counter']>

/** Name of the custom counter incremented by the demo endpoint. */
const CATALOG_LOOKUPS_TOTAL = 'catalog_lookups_total'

/** Help text attached to the custom counter. */
const CATALOG_LOOKUPS_HELP = 'Total catalog lookups performed through the metrics demo endpoint.'

/** The demo lookup outcome: the metric name and its running total. */
export interface LookupResult {
  /** The counter that was incremented. */
  readonly metric: string
  /** The counter's total after this increment. */
  readonly total: number
}

/**
 * Owns the `catalog_lookups_total` counter on the injected registry.
 */
@Injectable()
export class MetricsDemoService {
  /** The lazily created counter, cached after the first lookup. */
  private counter: LookupCounter | undefined

  /**
   * @param registry - The library's dedicated `prom-client` registry, the same
   *   one the `/metrics` endpoint scrapes.
   */
  constructor(@Inject(BYMAX_METRICS_REGISTRY) private readonly registry: MetricsRegistry) {}

  /**
   * Increment the catalog-lookup counter and report its running total.
   *
   * @returns The counter name and its total after the increment.
   */
  async recordLookup(): Promise<LookupResult> {
    const counter = await this.resolveCounter()
    counter.inc()
    const snapshot = await counter.get()
    const total = snapshot.values.reduce((sum, entry) => sum + entry.value, 0)
    return { metric: CATALOG_LOOKUPS_TOTAL, total }
  }

  /**
   * Get the counter, creating it against the injected registry on first use.
   *
   * The get-or-create through `getSingleMetric` keeps repeated resolution safe
   * if the same registry already carries the counter (for example across a
   * re-instantiated service), so a duplicate registration never throws.
   *
   * @returns The cached or freshly registered counter.
   */
  private async resolveCounter(): Promise<LookupCounter> {
    if (this.counter !== undefined) {
      return this.counter
    }
    const promClient = await import('prom-client')
    const existing = this.registry.getSingleMetric(CATALOG_LOOKUPS_TOTAL)
    this.counter =
      existing instanceof promClient.Counter
        ? existing
        : new promClient.Counter({
            name: CATALOG_LOOKUPS_TOTAL,
            help: CATALOG_LOOKUPS_HELP,
            registers: [this.registry],
          })
    return this.counter
  }
}
