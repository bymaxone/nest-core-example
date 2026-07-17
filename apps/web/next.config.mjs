/**
 * @fileoverview Next.js 16 configuration for apps/web.
 *
 * The dashboard calls apps/api directly from the browser at
 * NEXT_PUBLIC_API_URL (the API enables CORS for the configured WEB_ORIGIN),
 * so no rewrite proxy is needed here. Security headers are set on every
 * response as a baseline; the CSP `connect-src` allows the configured API
 * origin so the client's `fetch` calls are not blocked.
 *
 * `next-env.d.ts` always imports a generated `.next/types/routes.d.ts`
 * (unconditional in Next.js 16, independent of `typedRoutes`), so the
 * `typecheck` script runs `next typegen` first to materialize it without a
 * full production build. `typedRoutes` itself stays off: this dashboard does
 * not need statically-typed `<Link href>` validation.
 *
 * @module next.config
 */

import process from 'node:process'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  async headers() {
    const isProduction = process.env['NODE_ENV'] === 'production'
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? ''
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing — required by browsers to honour declared Content-Type.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Deny embedding in <iframe>, <embed>, or <object> to block clickjacking.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Restrict Referer header to origin only on cross-origin requests.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Force HTTPS for 1 year in production; disabled in dev to avoid breaking localhost.
          ...(isProduction
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Unsafe-inline is required for RSC streaming and React hydration in Next.js.
              "script-src 'self' 'unsafe-inline'",
              `connect-src 'self' ${apiUrl}`,
              "img-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ]
              .join('; ')
              .trim(),
          },
        ],
      },
    ]
  },
}

export default nextConfig
