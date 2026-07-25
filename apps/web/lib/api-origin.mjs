/**
 * @fileoverview The development default for the API origin, shared by the two
 * places that must agree on it.
 *
 * `lib/env.ts` applies it to the value the client fetches with, and
 * `next.config.mjs` splices it into the CSP `connect-src`. If those two ever
 * disagree the app fails in its worst possible way: it renders normally while
 * the browser blocks every API call, with no error beyond a CSP violation.
 * Plain `.mjs` because `next.config.mjs` loads before any TypeScript is
 * compiled and so cannot import a `.ts` module.
 *
 * @module lib/api-origin
 */

/** Development default for `NEXT_PUBLIC_API_URL`: the API's own default port. */
export const DEFAULT_API_ORIGIN = 'http://localhost:3001'
