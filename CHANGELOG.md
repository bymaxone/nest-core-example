# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-17

The first complete release: `nest-core-example` is the runnable, verifiable usage reference for
`@bymax-one/nest-core@0.1.0`, consumed as a real downstream app via `file:../../../nest-core`.

### Added

- **Monorepo & toolchain** - pnpm workspace with `apps/api` (NestJS 11) and `apps/web`
  (Next.js 16), TypeScript 5.9 strict, ESLint 9 flat config, Prettier, husky + commitlint, and a
  CI workflow that thinly calls the org-wide reusable pipeline (`bymaxone/.github`).
- **API: core wiring** - `BymaxCoreModule.forRootAsync` built from a Zod-validated environment,
  an AsyncLocalStorage correlation-id provider, and a bounded, poisonable ring-buffer timing sink.
- **API: demo domain** - an in-memory, seeded, deterministic product catalog exercising the whole
  `./pagination` subpath (offset and opaque cursor), the failure-injection surface covering every
  `BYMAX_*` code derivation plus the unknown-throw collapse, the Latency Lab, the `./health`
  aggregate with event-loop / flaky / hanging indicators, and a custom Prometheus counter on the
  library's injected registry.
- **Dashboard** - six pages (Overview, Errors, Latency, Pagination, Health, Metrics) over the API,
  in the shared Bymax design system, with the error-envelope contract mirrored and pinned.
- **The reference bar** - 100% unit coverage on both apps, E2E of every route and configuration
  variant, Stryker mutation testing (api `break: 100`, web `break: 90` with `lib/**` at 100), and
  a zero-dependency library export-usage audit (`pnpm audit:exports`) - all gated in CI.
- **Docs** - the technical specification (with the Feature Coverage Matrix), the phased
  development plan, the per-phase task files, and this README with verified `curl` journeys.

[0.1.0]: https://github.com/bymaxone/nest-core-example/releases/tag/v0.1.0
