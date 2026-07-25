/**
 * @fileoverview The API origin's validation contract, shared by the two places
 * that must agree on it.
 *
 * `lib/env.ts` applies it to the value the client fetches with, and
 * `next.config.mjs` splices it into the CSP `connect-src`. If those two ever
 * disagree the app fails in its worst possible way: it renders normally while
 * the browser blocks every API call, with no error beyond a CSP violation.
 * Plain `.mjs` because `next.config.mjs` loads before any TypeScript is
 * compiled and so cannot import a `.ts` module.
 *
 * The contract both sides share, through {@link isSupportedApiUrl}: an absent
 * value means a fresh checkout and takes the default; any value that is present
 * must be an absolute `http:` or `https:` URL, or startup fails loudly.
 *
 * @module lib/api-origin
 */

/** Development default for `NEXT_PUBLIC_API_URL`: the API's own default port. */
export const DEFAULT_API_ORIGIN = 'http://localhost:3001'

/** The only schemes the dashboard can fetch over, and the only ones a CSP source can name. */
const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * Whether a value is usable as the API base URL.
 *
 * Being parseable is not enough. `javascript:alert(1)` and `file:///x` are both
 * valid URLs whose `origin` is the string `"null"`, which the client cannot
 * fetch and which yields a CSP source no request can ever match. Restricting
 * the scheme is what makes the value meaningful to both consumers.
 *
 * @param {unknown} value - The candidate API base URL.
 * @returns {boolean} True when `value` is an absolute `http:`/`https:` URL.
 */
export function isSupportedApiUrl(value) {
  if (typeof value !== 'string') {
    return false
  }
  try {
    return SUPPORTED_PROTOCOLS.has(new URL(value).protocol)
  } catch {
    return false
  }
}

/**
 * Resolve the CSP `connect-src` source for the configured API.
 *
 * Returns the URL's **origin**, never the raw input. A CSP source expression is
 * delimited by `;`, and `;` is legal in a URL path: interpolating a raw value
 * such as `http://host/;script-src *` would close `connect-src` and append an
 * attacker-chosen directive to the policy. Reducing to the origin drops the
 * path entirely, so no input can escape its own directive. It also keeps the
 * source at the granularity CSP actually matches connections on.
 *
 * Nullish coalescing is not enough to guard the input either: `??` passes an
 * empty string through, and `NEXT_PUBLIC_API_URL=` in an env file is exactly an
 * empty string, which would emit a policy naming no API origin at all and
 * silently block every request while the page still renders.
 *
 * @param {string | undefined} rawValue - The raw `NEXT_PUBLIC_API_URL` value.
 * @returns {string} The origin of the configured URL, or of the default when absent.
 * @throws {Error} When the value is present but not an absolute `http:`/`https:` URL.
 */
export function resolveApiOrigin(rawValue) {
  const candidate = rawValue === undefined ? DEFAULT_API_ORIGIN : rawValue
  if (!isSupportedApiUrl(candidate)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_URL: expected an absolute http(s) URL, received ${JSON.stringify(rawValue)}. ` +
        `Leave it unset to use the ${DEFAULT_API_ORIGIN} development default.`,
    )
  }
  return new URL(candidate).origin
}
