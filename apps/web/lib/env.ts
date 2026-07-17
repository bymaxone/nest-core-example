/**
 * @fileoverview Validated, frozen environment configuration for apps/web.
 *
 * All process.env reads in apps/web MUST go through this module. `NODE_ENV`
 * and `NEXT_PUBLIC_*` variables are exposed to the browser bundle by Next.js
 * at build time; there are no server-only secrets in this dashboard, so every
 * variable declared here is safe to read from client components.
 *
 * Throws at module load with a human-readable error if any required variable
 * is missing or malformed, so a misconfigured deployment fails loudly instead
 * of silently calling the wrong API origin.
 *
 * @layer config
 */

import { z } from 'zod'

/** Zod schema for every env var consumed by apps/web. */
const envSchema = z.object({
  /**
   * Base URL of the NestJS API the browser calls directly (CORS is enabled
   * on the API for this origin). No same-origin proxy is used.
   */
  NEXT_PUBLIC_API_URL: z.url(),
})

/**
 * Snapshot of every env var this module reads, each accessed as a literal
 * `process.env.NEXT_PUBLIC_*` member expression.
 *
 * Next.js inlines `NEXT_PUBLIC_*` variables into the client bundle only when
 * it can statically find that exact literal access pattern at build time; a
 * generic `process.env` reference (passing the whole object through, or
 * destructuring it) is invisible to that static replacement; `process.env`
 * does not exist at all in the browser runtime, so a client component
 * reading it that way always sees `undefined`. This snapshot is the only
 * place in the module allowed to touch `process.env` directly, so every
 * other line only ever sees the (validated) result.
 */
const rawEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
}

/** Public type of the validated, frozen env object. */
export type Env = Readonly<z.infer<typeof envSchema>>

/**
 * Validated and frozen environment configuration.
 *
 * Throws at module load if any required variable is missing or invalid.
 * Use this instead of `process.env` throughout apps/web.
 */
export const env: Env = (() => {
  const result = envSchema.safeParse(rawEnv)
  if (!result.success) {
    const lines = result.error.issues.map((i) => {
      // Stryker disable next-line StringLiteral: the single web env var is top-level, so an issue path never has more than one segment and the join separator is never observable; the mutant is provably equivalent.
      const field = i.path.join('.')
      return `  • ${field}: ${i.message}`
    })
    // Stryker disable next-line StringLiteral: only one variable is validated, so the issue list always has a single line and the newline join separator is never observable; the mutant is provably equivalent.
    const issues = lines.join('\n')
    throw new Error(`Invalid web env:\n${issues}`)
  }
  return Object.freeze(result.data)
})()
