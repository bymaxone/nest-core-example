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

/** Public type of the validated, frozen env object. */
export type Env = Readonly<z.infer<typeof envSchema>>

/**
 * Validated and frozen environment configuration.
 *
 * Throws at module load if any required variable is missing or invalid.
 * Use this instead of `process.env` throughout apps/web.
 */
export const env: Env = (() => {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid web env:\n${issues}`)
  }
  return Object.freeze(result.data)
})()
