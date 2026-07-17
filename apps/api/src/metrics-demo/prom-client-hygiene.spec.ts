/**
 * Import-hygiene test for the optional prom-client peer.
 *
 * Layer: unit (filesystem scan of the API source tree).
 * Goal: prove no source file imports prom-client statically, so the optional
 * peer is loaded only through the library's lazily injected registry and the
 * disabled-metrics path never pulls it in.
 * Mocks: none; reads the real src tree.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from '@jest/globals'

/**
 * A static import of the optional peer: either the ESM import-from form or the
 * CommonJS require form naming the package. The sanctioned dynamic import call
 * has no `from` clause, so it is deliberately not matched and never trips this
 * gate. The pattern is split across fragments so this scanner never flags its
 * own source.
 */
const PACKAGE = ['prom', 'client'].join('-')
const STATIC_PEER_IMPORT = new RegExp(
  `\\bfrom\\s+['"]${PACKAGE}['"]|\\brequire\\(\\s*['"]${PACKAGE}['"]\\s*\\)`,
)

/**
 * Recursively collect every file under a directory.
 *
 * @param dir - The directory to walk.
 * @returns Absolute paths of every file beneath it.
 */
function collectFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(full))
    } else {
      files.push(full)
    }
  }
  return files
}

describe('prom-client import hygiene', () => {
  /**
   * No static import anywhere under src.
   *
   * The injected `BYMAX_METRICS_REGISTRY` is the only path to prom-client;
   * a static import would eagerly load the optional peer even when metrics are
   * disabled, defeating the zero-cost disabled path.
   */
  it('never imports prom-client statically under src', () => {
    const tsFiles = collectFiles(join(process.cwd(), 'src')).filter((file) => file.endsWith('.ts'))

    const offenders = tsFiles.filter((file) => STATIC_PEER_IMPORT.test(readFileSync(file, 'utf8')))

    expect(offenders).toEqual([])
  })
})
