/**
 * @fileoverview Landing page: the public entry point of nest-core-example.
 *
 * Mirrors the landing surface of the sibling example apps so the family reads as
 * one product: dark background with three ambient glow layers, an orange brand
 * gradient headline, glassmorphism feature cards, and pill CTA buttons. Only the
 * copy differs, because the library demonstrated here is the HTTP-foundation
 * package.
 *
 * A pure server component. It renders outside `/dashboard`, so it carries
 * neither the topbar and sidebar nor the query client.
 *
 * @layer screen
 */

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** One feature card rendered in the coverage grid. */
interface Feature {
  /** The card's decorative glyph. */
  readonly icon: React.ReactNode
  /** Short category label shown as a badge. */
  readonly badge: string
  /** Card headline. */
  readonly title: string
  /** One-sentence explanation of what the dashboard demonstrates. */
  readonly description: string
}

/** The library capabilities the dashboard demonstrates, in reading order. */
const FEATURES: readonly Feature[] = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 9v4m0 4h.01M10.3 3.9L2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
          stroke="#ff6224"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    badge: 'Envelope',
    title: 'One error shape, always',
    description:
      'A seven-field envelope on every failure, the full code catalog including the unmapped-4xx and unmapped-5xx fallbacks, and an unknown throw collapsed into the same contract.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="#ff6224" strokeWidth="1.5" />
        <path d="M12 7v5l3.5 2" stroke="#ff6224" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    badge: 'Timing',
    title: 'Route-template samples',
    description:
      'An interceptor that records the matched route template rather than the raw path, flags a request that crosses the slow threshold, and keeps reporting even when the sink throws.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="18" height="5" rx="1.5" stroke="#ff6224" strokeWidth="1.5" />
        <rect x="3" y="12" width="18" height="5" rx="1.5" stroke="#ff6224" strokeWidth="1.5" />
        <path d="M8 20h8" stroke="#ff6224" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    badge: 'Pagination',
    title: 'Offset and opaque cursor',
    description:
      'Clamped page and limit with derived metadata, and a cursor walked to its terminating null, with a tampered cursor rejected rather than silently reinterpreted.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12h4l2.5-6 5 12L17 12h4"
          stroke="#ff6224"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    badge: 'Health',
    title: 'Liveness and readiness that move',
    description:
      'A multi-indicator aggregate you can flip between 200 and 503 from the console, with per-indicator detail and a hung indicator reported down by timeout rather than hanging the probe.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 20V10M10 20V4M16 20v-7M22 20H2"
          stroke="#ff6224"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    badge: 'Metrics',
    title: 'A Prometheus scrape you can read',
    description:
      'A lazily created registry with default HTTP and process metrics, bounded label cardinality, default labels, and a custom application counter, shown raw and parsed side by side.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l7.8 3.5v5c0 4.4-3.1 8.4-7.8 9.5-4.7-1.1-7.8-5.1-7.8-9.5v-5L12 3z"
          stroke="#ff6224"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9.2 12.2l2 2 3.6-3.9" stroke="#ff6224" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    badge: 'Contract',
    title: 'Nothing hidden in production',
    description:
      'The dev-versus-prod contrast rendered side by side, so you can see exactly which internals the envelope exposes when the flag is on and what a client receives when it is off.',
  },
]

/** The `/` route: the public landing surface. */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Decorative only: the fields the glass cards sample through their blur. */}
      <div
        aria-hidden="true"
        className="animate-glow-float pointer-events-none fixed -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#ff6224] opacity-[0.08] blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="animate-glow-drift pointer-events-none fixed -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-[#60a5fa] opacity-[0.06] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-16 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-[#f97316] opacity-[0.04] blur-[120px]"
      />

      <main className="relative z-10">
        {/* `relative` is load-bearing: the scroll hint below is absolutely
            positioned and must anchor to the hero, not to the whole page. */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center">
          <div className="flex max-w-3xl flex-col items-center gap-6">
            <div
              className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(255,98,36,0.3)] bg-[rgba(255,98,36,0.15)]"
              aria-hidden="true"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#ff6224"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="bg-linear-to-r from-[#ff6224] to-amber-200 bg-clip-text font-mono text-4xl font-bold leading-tight tracking-tight text-transparent md:text-5xl lg:text-6xl">
              nest-core-example
            </h1>

            <p className="max-w-xl font-sans text-base leading-relaxed text-[rgba(255,255,255,0.7)] md:text-lg">
              A runnable reference application demonstrating every public export of{' '}
              <span className="font-mono text-[#ff6224]">@bymax-one/nest-core</span> — end to end,
              from the NestJS API to this Next.js control room, with no database and no
              infrastructure.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">Open the dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="https://github.com/bymaxone/nest-core"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View library
                </a>
              </Button>
            </div>
          </div>

          <div className="absolute bottom-8 flex flex-col items-center gap-1.5 text-xs uppercase tracking-widest text-[rgba(255,255,255,0.4)]">
            <span>scroll</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 3v10M3 8l5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </section>

        <section className="px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <h2 className="mb-3 font-mono text-3xl font-bold text-white">Feature coverage</h2>
              <p className="font-sans text-[rgba(255,255,255,0.6)]">
                Every public export of the library, demonstrated in a running app.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className="transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_32px_rgba(255,98,36,0.12)]"
                >
                  <CardHeader>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,98,36,0.3)] bg-[rgba(255,98,36,0.12)]">
                        {feature.icon}
                      </div>
                      <Badge variant="outline" className="text-[rgba(255,255,255,0.5)]">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-base normal-case tracking-tight text-[rgba(255,255,255,0.9)]">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed text-[rgba(255,255,255,0.55)]">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-4 font-mono text-3xl font-bold text-white">Ready to explore?</h2>
            <p className="mb-8 font-sans text-[rgba(255,255,255,0.6)]">
              Trigger any error code from the Envelope Playground, flip a health indicator until
              readiness answers 503, then watch both land in the timing feed and the metrics scrape.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard">Open the dashboard</Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-[rgba(255,255,255,0.06)] px-4 py-8 text-center font-mono text-xs text-[rgba(255,255,255,0.3)]">
          <p>
            nest-core-example — reference implementation for{' '}
            <a
              href="https://github.com/bymaxone/nest-core"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff6224] hover:underline"
            >
              @bymax-one/nest-core
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
