/**
 * @fileoverview Library export-usage audit for `@bymax-one/nest-core`.
 * @layer tooling
 *
 * Enforces the promise of the Feature Coverage Matrix: every identifier the
 * library ships from its packaged `exports` map is demonstrated somewhere in the
 * `apps/` corpus. The list of exports is read from the installed package's shipped
 * `.d.ts` files under `node_modules` (never a hardcoded list), so a new library
 * export that no app references fails the audit until it is demonstrated or
 * explicitly waived in `.audit-ignore.json` with a written reason.
 *
 * Zero third-party dependencies (only `node:*`): this runs on the CI critical path,
 * so it carries no supply-chain surface of its own.
 *
 * Usage:
 *   node scripts/audit-library-exports.mjs            audit the corpus (exit 1 on a miss)
 *   node scripts/audit-library-exports.mjs --self-test prove the failure path with a synthetic miss
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const LIBRARY = '@bymax-one/nest-core'
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** Directory names that never hold a demonstration and are skipped while walking. */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', '.stryker-tmp', 'reports'])
/** Test files are excluded: the audit proves exports are demonstrated, not merely tested. */
const TEST_FILE = /\.(spec|e2e-spec|test)\.(ts|tsx)$/
/**
 * Ambient declaration files (`*.d.ts`, e.g. `next-env.d.ts`) are excluded: they are
 * generated, type-only shims. An export named there would count as demonstrated
 * without any real runtime use, defeating the audit's purpose.
 */
const DECLARATION_FILE = /\.d\.ts$/
const SOURCE_FILE = /\.(ts|tsx)$/
/** Synthetic export name the `--self-test` flag injects to prove the failure path exits 1. */
const SELF_TEST_MISS = '__nest_core_audit_self_test_missing_export__'

/**
 * Escape RegExp metacharacters so an identifier is matched literally.
 *
 * Identifiers may legally contain `$`, which is a RegExp anchor; interpolating a
 * raw name would mis-match (a false pass or false miss). Escaping keeps the
 * word-boundary demonstration check exact for any valid identifier.
 *
 * @param literal - The identifier to embed in a RegExp.
 * @returns The identifier with every metacharacter backslash-escaped.
 */
function escapeRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build a RegExp matching `name` only as a whole identifier.
 *
 * `\b` treats `$` as a word boundary, so `\b$foo\b` fails to match a `$`-prefixed
 * export referenced after whitespace or punctuation. Identifier-character
 * lookarounds (`[\w$]`) match the name exactly when it is not part of a longer
 * identifier, for any valid identifier including `$`-containing ones.
 *
 * @param name - The exported identifier to match as a standalone token.
 * @returns A RegExp asserting `name` is bounded by non-identifier characters.
 */
function wholeIdentifier(name) {
  return new RegExp(`(?<![\\w$])${escapeRegExp(name)}(?![\\w$])`)
}

/**
 * Resolve the absolute path to the installed library's package root.
 *
 * The library is a `file:` dependency of `apps/api` only, so resolution is anchored
 * there; the package root is two levels up from its resolved entry (`dist/index.cjs`).
 *
 * @returns The absolute directory that contains the library's `package.json`.
 */
function resolveLibraryRoot() {
  const require = createRequire(import.meta.url)
  const entry = require.resolve(LIBRARY, { paths: [path.join(REPO_ROOT, 'apps', 'api')] })
  return path.dirname(path.dirname(entry))
}

/**
 * Collect the shipped type-declaration files for every subpath in the `exports` map.
 *
 * @param libRoot - Absolute path to the library package root.
 * @returns Absolute paths to each subpath's `types` `.d.ts` entry.
 */
function shippedTypeFiles(libRoot) {
  const pkg = JSON.parse(readFileSync(path.join(libRoot, 'package.json'), 'utf8'))
  const files = []
  for (const entry of Object.values(pkg.exports ?? {})) {
    const types = resolveTypesTarget(entry)
    if (typeof types === 'string' && types.endsWith('.d.ts')) {
      files.push(path.resolve(libRoot, types))
    }
  }
  if (files.length === 0) throw new Error(`No .d.ts type entries found in ${LIBRARY} exports map`)
  return files
}

/**
 * Extract the exported identifier names declared in a single `.d.ts` file.
 *
 * Handles both `export { A, type B, C as D }` re-export lists and standalone
 * `export (declare) const|function|class|type|interface|enum NAME` declarations,
 * stripping `type` modifiers and resolving `X as Y` aliases to the exported name.
 *
 * @param source - The raw `.d.ts` file contents.
 * @returns The set of exported identifier names.
 */
function extractExports(source) {
  const names = new Set()
  for (const block of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const raw of block[1].split(',')) {
      const item = raw.trim().replace(/^type\s+/, '')
      if (!item) continue
      const asMatch = item.match(/\s+as\s+([\w$]+)$/)
      const name = asMatch ? asMatch[1] : item
      if (/^[A-Za-z_$][\w$]*$/.test(name) && name !== 'default') names.add(name)
    }
  }
  const declRe =
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|let|var|function|class|type|interface|enum|namespace)\s+([A-Za-z_$][\w$]*)/g
  for (const decl of source.matchAll(declRe)) names.add(decl[1])
  return names
}

/**
 * Recursively collect every non-test source file under a directory.
 *
 * @param dir - Absolute directory to walk.
 * @param acc - Accumulator of absolute file paths.
 * @returns The accumulator, for convenience.
 */
function collectSources(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) collectSources(full, acc)
    else if (SOURCE_FILE.test(name) && !TEST_FILE.test(name) && !DECLARATION_FILE.test(name))
      acc.push(full)
  }
  return acc
}

/**
 * Read `.audit-ignore.json`, returning a map of waived export name to reason.
 *
 * Every entry must carry a non-empty `reason`; a missing reason is a hard error so
 * waivers are always justified in writing.
 *
 * @returns A map of ignored export name to its written reason.
 */
function loadIgnores() {
  let raw
  try {
    raw = readFileSync(path.join(REPO_ROOT, '.audit-ignore.json'), 'utf8')
  } catch (err) {
    // A missing waiver file legitimately means "no waivers"; any other read
    // error (permissions, a directory in its place) is a real problem to surface.
    if (err?.code === 'ENOENT') return new Map()
    throw err
  }
  // A malformed waiver file must fail loudly here, not silently drop every waiver
  // and resurface later as confusing "undemonstrated exports".
  const parsed = JSON.parse(raw)
  const map = new Map()
  for (const entry of parsed.ignored ?? []) {
    if (!entry?.name || typeof entry.reason !== 'string' || entry.reason.trim() === '') {
      throw new Error(
        `.audit-ignore.json entry for "${entry?.name ?? '?'}" needs a non-empty reason`,
      )
    }
    map.set(entry.name, entry.reason)
  }
  return map
}

/**
 * Run the audit and exit with the appropriate status code.
 *
 * @returns Never returns normally; always calls `process.exit`.
 */
function main() {
  const selfTest = process.argv.includes('--self-test')
  const libRoot = resolveLibraryRoot()
  const exports = new Set()
  for (const file of shippedTypeFiles(libRoot)) {
    for (const name of extractExports(readFileSync(file, 'utf8'))) exports.add(name)
  }
  if (selfTest) exports.add(SELF_TEST_MISS)

  const corpus = collectSources(path.join(REPO_ROOT, 'apps'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const ignores = loadIgnores()

  const missing = []
  for (const name of [...exports].sort()) {
    if (ignores.has(name)) continue
    if (!wholeIdentifier(name).test(corpus)) missing.push(name)
  }

  reportStaleIgnores(ignores, exports, corpus)
  return finish({ total: exports.size, missing, ignored: ignores.size, selfTest })
}

/**
 * Warn about waivers that are no longer needed (the export is now demonstrated).
 *
 * @param ignores - Map of waived export name to reason.
 * @param exports - The full set of shipped export names.
 * @param corpus - The concatenated non-test app source.
 */
function reportStaleIgnores(ignores, exports, corpus) {
  for (const name of ignores.keys()) {
    if (exports.has(name) && wholeIdentifier(name).test(corpus)) {
      console.warn(
        `WARN  stale waiver: "${name}" is demonstrated; remove it from .audit-ignore.json`,
      )
    }
  }
}

/**
 * Print the final report and exit 0 (all demonstrated) or 1 (undemonstrated exports).
 *
 * @param summary - Counts plus the list of undemonstrated export names.
 * @param summary.total - Number of shipped exports inspected.
 * @param summary.missing - Names not demonstrated and not waived.
 * @param summary.ignored - Number of active waivers.
 * @param summary.selfTest - Whether the synthetic self-test miss was injected.
 */
function finish({ total, missing, ignored, selfTest }) {
  const demonstrated = total - missing.length - ignored
  console.log(`Library export audit: ${LIBRARY}`)
  console.log(`  shipped exports : ${total}`)
  console.log(`  demonstrated    : ${demonstrated}`)
  console.log(`  waived          : ${ignored}`)
  console.log(`  undemonstrated  : ${missing.length}`)
  if (missing.length > 0) {
    console.error('\nUndemonstrated exports (add a demonstration, or waive with a reason):')
    for (const name of missing) console.error(`  - ${name}`)
    if (selfTest)
      console.error('\n(--self-test injected a synthetic miss to prove this failure path)')
    process.exit(1)
  }
  console.log('\nAll shipped exports are demonstrated in apps/. OK.')
  process.exit(0)
}

main()

/**
 * Resolve the declaration target of one `exports` entry.
 *
 * An entry may be a bare string, a flat object carrying `types`, or a
 * conditional object where `types` sits under `import` / `require`. TypeScript
 * resolves through the conditions, so reading only the top level reports the
 * library as unbuilt the moment it ships dual ESM/CJS. That is what this audit
 * did: every subpath failed with "Reinstall or rebuild the library" while the
 * declaration files were present all along.
 *
 * @param entry - The value of one subpath in the exports map.
 * @returns The relative path of the declaration file, or undefined.
 */
function resolveTypesTarget(entry) {
  if (typeof entry === 'string') return entry
  if (entry === null || typeof entry !== 'object') return undefined
  if (typeof entry.types === 'string') return entry.types
  // Order mirrors what a consumer hits first; `default` last so a more specific
  // condition wins, which is how the resolver itself reads the map.
  for (const condition of ['import', 'require', 'node', 'default']) {
    const nested = entry[condition]
    if (nested === undefined || typeof nested === 'string') continue
    const resolved = resolveTypesTarget(nested)
    if (resolved !== undefined) return resolved
  }
  return undefined
}
