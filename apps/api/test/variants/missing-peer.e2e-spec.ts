/**
 * @fileoverview Missing-peer fail-fast E2E (Feature-Coverage-Matrix row 62).
 *
 * `metrics.enabled: true` lazily loads the optional `prom-client` peer; when
 * the peer cannot be resolved, the library must fail boot with a descriptive
 * error naming the package and the install command rather than a cryptic
 * resolution failure at the first scrape.
 *
 * Mechanism: `jest.unstable_mockModule('prom-client', factory)` registers a
 * mock in Jest's ESM module registry for this file's isolated module graph,
 * intercepting every `import('prom-client')` reached from this file's module
 * tree, including the library's own dynamic `await import('prom-client')`
 * deep inside its lazy registry loader. The factory throws an error carrying
 * `code: 'MODULE_NOT_FOUND'`, the same shape Node's real resolver produces
 * for an absent package, so the library's `isMissingModuleError` guard
 * recognizes it and converts it to the documented descriptive message. The
 * mock is registered before any dynamic import of `@bymax-one/nest-core`
 * (imported here only via a deferred `await import(...)` after the mock is
 * in place), so it is never shared with, or leaked into, another spec file's
 * module registry.
 *
 * @layer test
 */

import { describe, expect, it, jest } from '@jest/globals'
import { Test } from '@nestjs/testing'

describe('missing-peer fail-fast (metrics enabled, prom-client unresolvable)', () => {
  /**
   * Descriptive boot rejection.
   *
   * With the `prom-client` resolution forced to fail, registering the module
   * with `metrics.enabled: true` must reject `compile()` with an error naming
   * both the missing package and the exact install command, so an operator
   * who forgets the optional peer gets a legible failure at boot.
   */
  it('rejects module compilation naming prom-client and the install command', async () => {
    jest.unstable_mockModule('prom-client', () => {
      const error = new Error('Cannot find module prom-client')
      ;(error as NodeJS.ErrnoException).code = 'MODULE_NOT_FOUND'
      throw error
    })

    const { BymaxCoreModule } = await import('@bymax-one/nest-core')

    const boot = Test.createTestingModule({
      imports: [BymaxCoreModule.forRoot({ metrics: { enabled: true } })],
    }).compile()

    await expect(boot).rejects.toThrow(/prom-client is not installed/)
    await expect(boot).rejects.toThrow(/pnpm add prom-client/)
  })
})
