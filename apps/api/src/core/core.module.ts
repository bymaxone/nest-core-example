/**
 * @fileoverview Binds the example's implementations onto the library's DI
 * tokens and feeds the demo timing ring buffer. Global so the bindings are
 * visible to the library's own globally-registered filter and interceptor.
 * @layer module
 *
 * Token bindings are the copy-paste reference for real consumers:
 *   - `BYMAX_CORRELATION_PROVIDER` -> `RequestContextService`. Honored on both
 *     registration paths, so every error envelope carries the request id.
 *   - `BYMAX_TIMING_SINK` -> `RingBufferTimingSink`. Honored on `forRoot`; on the
 *     `forRootAsync` path the library owns this token (metrics bridge or a no-op),
 *     so this binding is shadowed there. To keep the demo sink populated
 *     regardless, this module also registers the library's own `TimingInterceptor`
 *     pointed directly at the ring buffer, reusing the library's measurement
 *     logic rather than reimplementing it.
 */

import { Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import {
  BYMAX_CORE_OPTIONS,
  BYMAX_CORRELATION_PROVIDER,
  BYMAX_TIMING_SINK,
  TimingInterceptor,
} from '@bymax-one/nest-core'
import type { ResolvedCoreOptions } from '@bymax-one/nest-core'

import { RequestContextService } from './request-context.service.js'
import { RingBufferTimingSink } from './ring-buffer-timing.sink.js'

/**
 * Build the library timing interceptor bound to the demo ring buffer.
 *
 * The interceptor's monotonic clock defaults to the library's own, so the
 * example gets identical route-template extraction and slow-flag computation
 * without duplicating any of it.
 *
 * @param options - The resolved core options, supplying the slow threshold.
 * @param sink - The demo ring buffer that receives each sample.
 * @returns A timing interceptor writing to the ring buffer.
 */
export function createRingBufferTimingInterceptor(
  options: ResolvedCoreOptions,
  sink: RingBufferTimingSink,
): TimingInterceptor {
  return new TimingInterceptor(options, sink)
}

/**
 * Global wiring module for the library's pluggable contracts.
 */
@Global()
@Module({
  providers: [
    RequestContextService,
    RingBufferTimingSink,
    { provide: BYMAX_CORRELATION_PROVIDER, useExisting: RequestContextService },
    { provide: BYMAX_TIMING_SINK, useExisting: RingBufferTimingSink },
    {
      provide: APP_INTERCEPTOR,
      useFactory: createRingBufferTimingInterceptor,
      inject: [BYMAX_CORE_OPTIONS, RingBufferTimingSink],
    },
  ],
  exports: [RequestContextService, RingBufferTimingSink, BYMAX_CORRELATION_PROVIDER],
})
export class CoreWiringModule {}
