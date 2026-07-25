/**
 * @fileoverview The API origin's resolution contract, shared by the two places
 * that must agree on it.
 *
 * `lib/env.ts` applies it to the value the client fetches with, and
 * `next.config.mjs` splices it into the CSP `connect-src`. If those two ever
 * disagree the app fails in its worst possible way: it renders normally while
 * the browser blocks every API call, with no error beyond a CSP violation.
 * Plain `.mjs` because `next.config.mjs` loads before any TypeScript is
 * compiled and so cannot import a `.ts` module.
 *
 * The contract both sides implement: an absent value means a fresh checkout and
 * takes the default; any value that is present must be a valid absolute URL, or
 * startup fails loudly. `lib/env.ts` enforces it through its Zod schema, which
 * rejects `''` and any malformed URL for the same reason this module does.
 *
 * @module lib/api-origin
 */

/** Development default for `NEXT_PUBLIC_API_URL`: the API's own default port. */
export const DEFAULT_API_ORIGIN = 'http://localhost:3001'

/**
 * Resolve the configured API origin, or throw if it is set to something unusable.
 *
 * Nullish coalescing alone is not enough here: `??` passes an empty string
 * straight through, and `NEXT_PUBLIC_API_URL=` in an env file is exactly an
 * empty string. Interpolated into `connect-src 'self' ${origin}` that yields a
 * policy naming no API origin at all, which silently blocks every request while
 * the page still renders. A malformed value is no better, becoming a CSP source
 * the browser cannot match. Both must fail at startup instead.
 *
 * @param {string | undefined} rawValue - The raw `NEXT_PUBLIC_API_URL` value.
 * @returns {string} The default when absent, otherwise the validated value.
 * @throws {Error} When the value is present but not a valid absolute URL.
 */
export function resolveApiOrigin(rawValue) {
  if (rawValue === undefined) {
    return DEFAULT_API_ORIGIN
  }
  try {
    new URL(rawValue)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_URL: expected an absolute URL, received ${JSON.stringify(rawValue)}. ` +
        `Leave it unset to use the ${DEFAULT_API_ORIGIN} development default.`,
    )
  }
  return rawValue
}
