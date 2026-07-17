# nest-core-example: Technical Specification

> The canonical reference application for **`@bymax-one/nest-core`**, the application foundation
> kit for NestJS 11 (stable error envelope, request timing, offset and cursor pagination, health
> checks, optional Prometheus metrics). A NestJS API plus a Next.js dashboard that exercises
> **every** public feature of the library in a runnable, realistic scenario, and makes the
> invisible parts (envelope mapping, timing samples, cursor mechanics, readiness aggregation,
> lazy metrics) tangible on screen.
>
> Maintained by **Bymax One** · MIT · Part of the `@bymax-one/*` reference-app family
> (`nest-auth-example`, `nest-logger-example`, `nest-cache-example`, ...).

---

> 📄 **About this document.** This is the authoritative, forward-looking technical blueprint for
> `nest-core-example`, authored **before implementation**. It is the source the phased
> [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) and the per-phase `docs/tasks/phase-NN-*.md` files
> derive from. It describes the intended end state so that planning, task scaffolding, and review
> all share one contract. The API surface described here mirrors the library's technical
> specification at version `0.1.0`; every signature is re-verified against the shipped type
> declarations (`dist/index.d.ts`, `dist/pagination/index.d.ts`, `dist/health/index.d.ts`)
> and any drift is reconciled in this document, never papered over.

> ⚠️ **Library status.** `@bymax-one/nest-core` is **ready in its sibling local checkout
> (`../nest-core`) and is not published to npm for now**. The example consumes it via the
> `file:../../../nest-core` protocol, which packs the library respecting its
> `files`/`exports` fields. Phases that consume the package require its `dist/` to be built
> (see [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md), External Precondition). Everything that
> does not need the package (repository foundation, tooling, CI) proceeds immediately.

---

## Table of Contents

1. [Purpose & Audience](#1--purpose--audience)
2. [Goals & Non-Goals](#2--goals--non-goals)
3. [Architecture at a Glance](#3--architecture-at-a-glance)
4. [The Library Under Test: `@bymax-one/nest-core`](#4--the-library-under-test-bymax-onenest-core)
5. [Tech Stack](#5--tech-stack)
6. [Repository Layout](#6--repository-layout)
7. [Feature Coverage Matrix](#7--feature-coverage-matrix)
8. [Library Consumption](#8--library-consumption)
9. [Configuration & Environment](#9--configuration--environment)
10. [Backend Design: `apps/api`](#10--backend-design-appsapi)
11. [Demo Domain & REST API](#11--demo-domain--rest-api)
12. [Demonstration Scenarios](#12--demonstration-scenarios)
13. [Frontend Design: `apps/web`](#13--frontend-design-appsweb)
14. [Design System](#14--design-system)
15. [Error Handling](#15--error-handling)
16. [Observability](#16--observability)
17. [Local Stack & Docker](#17--local-stack--docker)
18. [Testing Strategy](#18--testing-strategy)
19. [Tooling & Conventions](#19--tooling--conventions)
20. [Security & Safety](#20--security--safety)
21. [Phased Delivery Plan](#21--phased-delivery-plan)
22. [What This Project Intentionally Excludes](#22--what-this-project-intentionally-excludes)
23. [References](#23--references)
24. [Document Status](#24--document-status)

---

## 1 · Purpose & Audience

`nest-core-example` exists to do three things, in order of importance:

1. **Demonstrate every public feature** of `@bymax-one/nest-core` in one runnable, realistic
   application: not isolated snippets, but a coherent demo domain where the error envelope, the
   timing interceptor, both pagination models, the health aggregator, and the metrics endpoint
   each earn their place.
2. **Make the invisible visible.** An error envelope contract, a `slow: true` timing flag, an
   opaque cursor, a readiness aggregation with per-indicator timeouts, and a lazily loaded
   metrics registry are hard to appreciate from a README. A live dashboard renders them so a
   reader _sees_ every `BYMAX_*` code produced on demand, _sees_ a request cross the slow
   threshold, _sees_ an indicator flip readiness from 200 to 503, _sees_ `/metrics` appear and
   disappear with configuration.
3. **Serve as the canonical integration reference** for any Bymax project (or external consumer)
   adopting the library: the copy-paste-grade `forRootAsync` factory, the correlation provider
   binding, the timing sink implementation, the health indicator implementations, and the custom
   metric registered against the injected registry.

It doubles as the library's **dogfooding harness**: building the example against the published
API surfaces ergonomics and gaps a unit-test suite cannot.

**Audience:** backend engineers evaluating or adopting the library; frontend engineers wiring an
operations dashboard; reviewers auditing the library's API; and AI agents executing the phased
plan.

---

## 2 · Goals & Non-Goals

### Goals

- **G1: Total surface coverage.** Every export of `@bymax-one/nest-core` (all three subpaths) is
  demonstrated and tracked in the [Feature Coverage Matrix](#7--feature-coverage-matrix) (§7).
- **G2: Honest semantics.** No demo misrepresents what the library does. Where the library has a
  boundary (HTTP-first filter, flat readiness with no dependency ordering, unsigned cursors, the
  async-path pass-through registration), the example demonstrates the boundary and the correct
  usage rather than hiding it.
- **G3: Production-grade wiring.** The `forRootAsync` factory, the correlation provider, the
  timing sink, the health indicators, and the graceful failure paths are written the way a real
  service should write them.
- **G4: One visual product.** The dashboard is visually indistinguishable from the other Bymax
  example apps: same design system (§14), same shell, same brand.
- **G5: Zero mandatory infra.** The API runs with no external services. The demo domain is an
  in-memory seeded catalog; health indicators are self-contained demonstrations. One optional
  Docker profile adds a real Prometheus to scrape `/metrics`.
- **G6: Authoritative documentation.** This spec, a phased plan, a polished README, and
  JSDoc-rich code that reads like a tutorial.

### Non-Goals

- **NG1: Not a production deployment template.** Local dev reference only; no Kubernetes or CD.
- **NG2: No authentication.** Out of scope: that is `@bymax-one/nest-auth`'s job. The dashboard
  is open on localhost.
- **NG3: No database or ORM.** The catalog is an in-memory seeded store; the library itself is
  ORM-agnostic and the example proves pagination without any persistence technology.
- **NG4: Not a Prometheus tutorial.** The optional Prometheus profile exists to prove the scrape
  path; dashboards and alerting are out of scope.
- **NG5: No logging engine.** `@bymax-one/nest-logger` integration is documented as the
  production pairing for the correlation contract, but this example ships its own minimal
  AsyncLocalStorage provider so the demonstration stands alone.

---

## 3 · Architecture at a Glance

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                             Browser (localhost:3000)                            │
│  Next.js 16 dashboard · React 19 · Tailwind v4 · shadcn new-york · forced dark  │
│                                                                                  │
│   TanStack Query ──HTTP──▶  (lib/api-client.ts, typed envelope-aware wrapper)   │
│   Pages: Overview · Errors Playground · Latency Lab · Pagination · Health · Metrics │
└───────────────┬──────────────────────────────────────────────────────────────┘
                │ REST (JSON) + text/plain (/metrics)
                ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                            NestJS API (localhost:3001)                          │
│                                                                                  │
│  BymaxCoreModule.forRootAsync({ envelope, timing, health, metrics })            │
│        │                                                                         │
│        ├── APP_FILTER ──▶ BymaxExceptionFilter ──▶ stable error envelope        │
│        │                       │ correlationId ◀── RequestContextService (ALS)  │
│        ├── APP_INTERCEPTOR ──▶ TimingInterceptor ──▶ RingBufferTimingSink       │
│        ├── HealthController (/health/live · /health/ready) ◀── demo indicators  │
│        └── MetricsController (/metrics) ◀── lazy prom-client registry           │
│                                                                                  │
│  Feature modules: catalog (pagination) · failures (envelope) · latency (slow)   │
│                   timing-feed · health-demo · metrics-demo                      │
└───────────────┬──────────────────────────────────────────────────────────────┘
                │ (optional, --profile tools)
                ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│              Prometheus (Docker, localhost:9090) scraping /metrics              │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Three planes, one library:**

- **Contract plane**: every error response flows through the library's exception filter; the
  dashboard's API client is typed against the envelope shape and the `BYMAX_*` code catalog.
- **Observation plane**: the timing interceptor feeds a demo ring-buffer sink (exposed as
  `GET /timing/samples`) and, when metrics are enabled, the library's internal metrics bridge.
- **Operations plane**: health endpoints aggregate toggleable demo indicators; `/metrics` serves
  the Prometheus text format from the lazily created registry.

---

## 4 · The Library Under Test: `@bymax-one/nest-core`

| Property         | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Package          | `@bymax-one/nest-core`                                                    |
| Version targeted | `0.1.0` (pre-1.0, consumed locally via `file:../../../nest-core`)         |
| Build            | Dual ESM + CJS + `.d.ts` (tsup)                                           |
| Subpaths         | `.` (module, filter, interceptor, tokens, interfaces, error codes) · `./pagination` · `./health` |
| Runtime deps     | **none** (`dependencies: {}`)                                             |
| Required peers   | `@nestjs/common ^11`, `@nestjs/core ^11`, `reflect-metadata ^0.2`, `rxjs ^7` |
| Optional peer    | `prom-client ^15` (only when metrics are enabled)                         |
| Node             | `>= 24`                                                                   |
| License          | MIT                                                                       |

### 4.1 Public API inventory (root subpath `.`)

The example must touch every row of this inventory; §7 maps each to where it is demonstrated.

**Module & registration**

- `BymaxCoreModule.forRoot(options)`: synchronous registration (disabled features omitted from
  the module definition).
- `BymaxCoreModule.forRootAsync(options)`: async registration via `useFactory` (the example's
  primary path; filter and interceptor slots always registered, gated inside factories).
- `BymaxCoreModuleOptions`: the options interface with four feature blocks (`envelope`, `timing`,
  `health`, `metrics`).
- `isGlobal` module extra (default `true`), decided synchronously by the builder.

**Error envelope**

- `BymaxExceptionFilter`: the global filter bound via `APP_FILTER`.
- Envelope contract: `statusCode` · `code` · `message` · `details?` · `correlationId?` ·
  `timestamp` · `path`.
- Mapping rules: `HttpException` passthrough, explicit `code` passthrough, validation shape to
  `BYMAX_VALIDATION_FAILED` with structured `details`, unknown errors collapse to
  `BYMAX_INTERNAL_ERROR` with a fixed message.
- `envelope.exposeInternals`: development-only inclusion of the original message and stack.
- `ICorrelationIdProvider`: `getCorrelationId(): string | undefined`, bound to
  `BYMAX_CORRELATION_PROVIDER` (no-op default).
- The `BYMAX_*` error code catalog (17 derivations; see §7.3).

**Request timing**

- `TimingInterceptor` bound via `APP_INTERCEPTOR`.
- `RequestTimingSample`: `method` · `route` (template, not raw URL) · `statusCode` ·
  `durationMs` · `slow`.
- `ITimingSink.record(sample)`: fire-and-forget, never allowed to break a request; bound to
  `BYMAX_TIMING_SINK` (no-op default).
- `timing.slowRequestThresholdMs`: the `slow` flag source.

**Injection tokens (Symbols)**

`BYMAX_CORE_OPTIONS` · `BYMAX_CORRELATION_PROVIDER` · `BYMAX_TIMING_SINK` ·
`BYMAX_HEALTH_INDICATORS` · `BYMAX_METRICS_REGISTRY`.

### 4.2 Public API inventory (`./pagination` subpath)

Pure, provider-free primitives (no validation-library decorators):

- Offset: `PageQuery` · `PageMeta` · `PageResult<T>` · `normalizePageQuery(raw, options?)`
  (clamps: `page >= 1`, `1 <= limit <= maxLimit`; defaults `defaultLimit = 20`,
  `maxLimit = 100`) · `buildPageResult(items, totalItems, query)`.
- Cursor: `encodeCursor(payload)` · `decodeCursor<T>(cursor)` (throws a
  `BYMAX_VALIDATION_FAILED` `HttpException` on malformed input) · `CursorQuery` ·
  `normalizeCursorQuery(raw, options?)` · `CursorResult<T>` ·
  `buildCursorResult(items, limit, toCursor)` (fetch-one-extra convention; `nextCursor` is
  `null` on the last page).

### 4.3 Public API inventory (`./health` subpath)

- `IHealthIndicator`: `readonly name` + `check(): Promise<HealthIndicatorResult>`.
- `HealthIndicatorResult`: `status: 'up' | 'down'` + optional `details`.
- Health response contract: `{ status: 'ok' | 'error', checks: [{ name, status, details? }] }`;
  liveness returns `{ status: 'ok', checks: [] }` and runs no indicators; readiness returns 200
  when all indicators are `up` and 503 otherwise.
- Aggregation semantics: all indicators run concurrently; `health.indicatorTimeoutMs`
  (default 5000) converts a hung indicator into a `down` entry with a diagnostic detail; one
  failing indicator never hides the results of the others.

### 4.4 Metrics surface

- Disabled by default; `metrics.enabled` gates the controller and the registry.
- `prom-client` is an **optional peer**, loaded lazily inside the registry factory only when
  metrics are enabled; enabling metrics without the peer installed fails fast at boot with a
  descriptive error naming the missing package.
- Default HTTP metrics when timing and metrics are both enabled: `http_requests_total`
  (counter) and `http_request_duration_seconds` (histogram), labels bounded to
  `method` · `route` · `status_code`.
- `metrics.defaultLabels` and `metrics.collectDefaultMetrics` (process metrics, on by default
  when enabled).
- Custom application metrics register against the injected `BYMAX_METRICS_REGISTRY`.

### 4.5 Option defaults

| Option                          | Default     | Notes                                             |
| ------------------------------- | ----------- | ------------------------------------------------- |
| `envelope.enabled`              | `true`      | filter registered via `APP_FILTER`                |
| `envelope.exposeInternals`      | `false`     | never enable in production                        |
| `timing.enabled`                | `true`      | interceptor registered via `APP_INTERCEPTOR`      |
| `timing.slowRequestThresholdMs` | _(unset)_   | `slow` is `false` when unset                      |
| `health.enabled`                | `true`      | controller at `GET /health/live` + `/health/ready` |
| `health.path`                   | `'health'`  | route prefix                                      |
| `health.indicatorTimeoutMs`     | `5000`      | per-indicator timeout                             |
| `metrics.enabled`               | `false`     | opt-in                                            |
| `metrics.path`                  | `'metrics'` | route                                             |
| `metrics.collectDefaultMetrics` | `true`      | when metrics are enabled                          |
| `isGlobal` (extra)              | `true`      | synchronous, decided by the builder               |

---

## 5 · Tech Stack

| Layer               | Technology                              | Version                     | Why                                        |
| ------------------- | ---------------------------------------- | --------------------------- | ------------------------------------------ |
| Foundation library  | `@bymax-one/nest-core`                   | `0.1.0`                     | the subject under demonstration            |
| API runtime         | NestJS                                   | `^11`                       | the library's target framework             |
| Node                | Node.js                                  | `>= 24`                     | library engine requirement                 |
| Metrics client      | `prom-client` (optional peer of the lib) | `^15`                       | the metrics demonstration                  |
| Validation          | `zod`                                    | `^4`                        | env + DTO validation (no class-validator)  |
| Config              | `@nestjs/config`                         | `^4`                        | typed `ConfigService<Env, true>`           |
| Frontend            | Next.js (App Router)                     | `^16`                       | matches sibling examples                   |
| UI runtime          | React                                    | `^19`                       |                                            |
| Styling             | Tailwind CSS                             | `^4`                        | design-system tokens                       |
| Components          | shadcn/ui (`new-york`) + `lucide-react`  | latest                      | brand component recipes                    |
| Fonts               | `geist` (Sans + Mono)                    | `^1`                        | design-system typography                   |
| Data fetching (web) | TanStack Query                           | `^5`                        | server-state cache + revalidation          |
| Toasts (web)        | `sonner`                                 | latest                      | glass toaster                              |
| Optional scraper    | Prometheus (Docker, `--profile tools`)   | `v3` image                  | proves the real scrape path                |
| Package manager     | pnpm (workspaces)                        | `>= 10.8` (pinned)          | matches all Bymax repos                    |
| Language            | TypeScript (strict)                      | `^5.9`                      | `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` |
| Lint/format         | ESLint 9 (flat) + Prettier               | `^9` / `^3`                 | shared Bymax config                        |
| Git hooks           | Husky + commitlint + lint-staged         | latest                      | Conventional Commits, enforced locally     |
| API tests           | Jest + `@nestjs/testing` + `supertest`   | `^30`                       | unit + E2E over the real HTTP pipeline     |
| Web tests           | Vitest + Testing Library                 | latest major (pinned)       | unit coverage of the dashboard             |

No database, no Redis, no message broker: the library has zero infrastructure requirements and
the example proves that honestly.

---

## 6 · Repository Layout

A pnpm monorepo. The library is consumed as an **external package** (never a workspace member)
so the example validates the published `exports` map, exactly as a real consumer would.

```
nest-core-example/
├── apps/
│   ├── api/                                  # NestJS application
│   │   ├── src/
│   │   │   ├── main.ts                        # bootstrap, CORS, shutdown hooks
│   │   │   ├── app.module.ts                  # BymaxCoreModule.forRootAsync + features
│   │   │   ├── config/
│   │   │   │   └── env.schema.ts              # Zod env schema + validateEnv() + Env type
│   │   │   ├── core/                          # library wiring (the copy-paste reference)
│   │   │   │   ├── core.config.ts             # buildCoreOptions(config) → BymaxCoreModuleOptions
│   │   │   │   ├── request-context.service.ts # ICorrelationIdProvider over AsyncLocalStorage
│   │   │   │   ├── request-context.middleware.ts
│   │   │   │   ├── ring-buffer-timing.sink.ts # ITimingSink demo (bounded in-memory buffer)
│   │   │   │   └── core.module.ts             # providers for the library's Symbol tokens
│   │   │   ├── common/
│   │   │   │   ├── zod-validation.pipe.ts     # Zod DTO parsing (400 with issue details)
│   │   │   │   └── domain-errors.ts           # app-level HttpExceptions with custom codes
│   │   │   ├── catalog/                       # seeded product domain: offset + cursor pagination
│   │   │   ├── failures/                      # trigger every BYMAX_* code on demand
│   │   │   ├── latency/                       # artificial-delay endpoint (slow flag lab)
│   │   │   ├── timing-feed/                   # GET /timing/samples from the ring-buffer sink
│   │   │   ├── health-demo/                   # toggleable indicators (up / down / timeout)
│   │   │   └── metrics-demo/                  # a custom counter against BYMAX_METRICS_REGISTRY
│   │   ├── test/
│   │   │   └── *.e2e-spec.ts                  # supertest E2E: envelope, pagination, health, metrics
│   │   ├── .env.example
│   │   ├── nest-cli.json · tsconfig*.json · jest.config.cjs
│   │   └── package.json
│   └── web/                                   # Next.js 16 dashboard
│       ├── app/
│       │   ├── layout.tsx · providers.tsx · globals.css · page.tsx (Overview)
│       │   ├── errors/page.tsx                # Error Envelope Playground
│       │   ├── latency/page.tsx               # Latency Lab (samples + slow flag)
│       │   ├── pagination/page.tsx            # offset + cursor data tables
│       │   ├── health/page.tsx                # Health Console (toggle indicators)
│       │   └── metrics/page.tsx               # Metrics view (raw + parsed)
│       ├── components/{layout,errors,latency,pagination,health,metrics,ui}/
│       ├── lib/
│       │   ├── api-client.ts                  # typed fetch wrapper, envelope-aware error union
│       │   ├── envelope.ts                    # ErrorEnvelope type + BYMAX_* code map (mirrored)
│       │   └── utils.ts                       # cn()
│       ├── tailwind.config.ts · components.json · postcss.config.mjs
│       └── package.json
├── docker/
│   └── prometheus/prometheus.yml              # optional scraper config (--profile tools)
├── docker-compose.yml                         # OPTIONAL: prometheus profile only (no default infra)
├── docs/
│   ├── TECHNICAL_SPECIFICATION.md             # this file (authoritative blueprint)
│   ├── DEVELOPMENT_PLAN.md                    # phased plan (derived from §21)
│   ├── design_system.html                     # shared Bymax UI source of truth
│   └── tasks/                                 # per-phase task files
├── .github/workflows/ci.yml                   # from Phase 0; public-only jobs conditional
├── pnpm-workspace.yaml                        # packages: ['apps/*']
├── package.json · tsconfig.base.json · eslint.config.mjs · .prettierrc.mjs
├── commitlint.config.mjs · lint-staged.config.mjs · renovate.json
├── .husky/ · .nvmrc (24) · .npmrc · .editorconfig · .gitmessage
└── README.md · CHANGELOG.md · LICENSE · CONTRIBUTING.md · CLAUDE.md · AGENTS.md
```

---

## 7 · Feature Coverage Matrix

The spine of the project. **Every** public export and documented behavior is demonstrated and
tracked here; the `DEVELOPMENT_PLAN.md` phases, the README "What's inside", and the CI export
audit all reference these rows. Status legend: ✅ planned-covered · ⛔ intentionally not
exercised (with reason).

> **CI-enforceable rule.** `scripts/audit-library-exports.mjs` diffs the library's shipped
> exports (`dist/{index,pagination/index,health/index}.d.ts`) against the `apps/` corpus and
> fails if a new export is undocumented, the same mechanism the sibling examples use. Lands in
> the final phase.

### 7.1 Module, registration & DI

| #   | Library surface                                     | Demonstrated in                                                 | Status |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| 1   | `BymaxCoreModule.forRootAsync`                       | `core/core.config.ts` + `app.module.ts` (primary wiring)         | ✅     |
| 2   | `BymaxCoreModule.forRoot`                            | E2E test module (sync wiring path)                                | ✅     |
| 3   | `BymaxCoreModuleOptions`                             | `core/core.config.ts` factory return type                         | ✅     |
| 4   | `isGlobal` extra (synchronous, default `true`)       | `app.module.ts` call site + inline note                            | ✅     |
| 5   | `BYMAX_CORE_OPTIONS`                                 | `timing-feed` reads the resolved threshold for display             | ✅     |
| 6   | `BYMAX_CORRELATION_PROVIDER` (`ICorrelationIdProvider`) | `core/request-context.service.ts` (ALS provider) + no-op default in one E2E | ✅ |
| 7   | `BYMAX_TIMING_SINK` (`ITimingSink`)                  | `core/ring-buffer-timing.sink.ts`                                  | ✅     |
| 8   | `BYMAX_HEALTH_INDICATORS` (`IHealthIndicator[]`)     | `health-demo` indicator set (multi-provider)                        | ✅     |
| 9   | `BYMAX_METRICS_REGISTRY`                             | `metrics-demo` custom counter registration                          | ✅     |
| 10  | Conditional registration: disabled feature = zero providers | E2E: config with `health.enabled: false` yields 404 on `/health/ready`; envelope off yields the raw Nest error shape | ✅ |
| 11  | Async pass-through slots (filter/interceptor gated in factories) | E2E: `forRootAsync` with timing disabled records zero samples | ✅ |

### 7.2 Error envelope: contract & mapping

| #   | Library surface                                      | Demonstrated in                                                  | Status |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| 12  | Envelope contract (7 fields, exact shape)             | `failures` + `web/app/errors` (rendered contract) + pinned E2E    | ✅     |
| 13  | `HttpException` mapping (status + message passthrough) | `failures` standard triggers                                       | ✅     |
| 14  | Explicit `code` passthrough (domain codes)             | `common/domain-errors.ts` (`CATALOG_OUT_OF_SEASON` custom code)    | ✅     |
| 15  | Validation shape → `BYMAX_VALIDATION_FAILED` + `details` | `ZodValidationPipe` reject path on catalog DTOs                   | ✅     |
| 16  | Unknown error collapse (500, fixed message, no leak)   | `failures` unknown-throw trigger, asserted in prod-mode E2E        | ✅     |
| 17  | `envelope.exposeInternals` (dev-only detail)           | side-by-side dev vs prod rendering on the Errors page              | ✅     |
| 18  | `correlationId` stamping via provider                  | every envelope carries the request id; header echo documented      | ✅     |
| 19  | `timestamp` + `path` fields                            | pinned contract E2E                                                 | ✅     |

### 7.3 Error code catalog (every derivation)

| #   | Code                                            | Triggered by                                            | Status |
| --- | ------------------------------------------------ | -------------------------------------------------------- | ------ |
| 20  | `BYMAX_BAD_REQUEST` (400)                        | `POST /failures/bad-request`                              | ✅     |
| 21  | `BYMAX_VALIDATION_FAILED` (400 validation shape) | invalid catalog DTO + malformed cursor                    | ✅     |
| 22  | `BYMAX_UNAUTHORIZED` (401)                       | `POST /failures/unauthorized`                             | ✅     |
| 23  | `BYMAX_FORBIDDEN` (403)                          | `POST /failures/forbidden`                                | ✅     |
| 24  | `BYMAX_NOT_FOUND` (404)                          | `GET /catalog/products/:id` with an unknown id            | ✅     |
| 25  | `BYMAX_CONFLICT` (409)                           | `POST /failures/conflict`                                 | ✅     |
| 26  | `BYMAX_PAYLOAD_TOO_LARGE` (413)                  | `POST /failures/payload-too-large`                        | ✅     |
| 27  | `BYMAX_UNSUPPORTED_MEDIA_TYPE` (415)             | `POST /failures/unsupported-media-type`                   | ✅     |
| 28  | `BYMAX_UNPROCESSABLE_ENTITY` (422)               | `POST /failures/unprocessable`                            | ✅     |
| 29  | `BYMAX_TOO_MANY_REQUESTS` (429)                  | `POST /failures/too-many-requests`                        | ✅     |
| 30  | `BYMAX_INTERNAL_ERROR` (500 + unknown collapse)  | `POST /failures/internal` + `POST /failures/unknown`      | ✅     |
| 31  | `BYMAX_NOT_IMPLEMENTED` (501)                    | `POST /failures/not-implemented`                          | ✅     |
| 32  | `BYMAX_BAD_GATEWAY` (502)                        | `POST /failures/bad-gateway`                              | ✅     |
| 33  | `BYMAX_SERVICE_UNAVAILABLE` (503)                | `POST /failures/service-unavailable` (+ readiness 503)    | ✅     |
| 34  | `BYMAX_GATEWAY_TIMEOUT` (504)                    | `POST /failures/gateway-timeout`                          | ✅     |
| 35  | `BYMAX_CLIENT_ERROR` (unmapped 4xx fallback)     | `POST /failures/teapot` (418)                             | ✅     |
| 36  | other 5xx → `BYMAX_INTERNAL_ERROR`               | `POST /failures/variant-5xx` (507)                        | ✅     |

### 7.4 Request timing

| #   | Library surface                                   | Demonstrated in                                             | Status |
| --- | -------------------------------------------------- | ------------------------------------------------------------ | ------ |
| 37  | `RequestTimingSample` (all five fields)             | `timing-feed` response shape + Latency Lab table              | ✅     |
| 38  | Route template (not raw URL) in `route`             | Lab shows `/catalog/products/:id` for varied ids              | ✅     |
| 39  | `slow` flag via `slowRequestThresholdMs`            | `GET /latency?ms=` above/below the threshold                  | ✅     |
| 40  | Error statuses still recorded                       | a failing request appears in the sample feed with its status  | ✅     |
| 41  | `ITimingSink` fire-and-forget (sink can never break a request) | a `?poison=sink` mode makes the demo sink throw once; the request still succeeds; E2E asserted | ✅ |
| 42  | No-op default sink                                  | E2E module without a sink provider boots and serves           | ✅     |

### 7.5 Pagination (`./pagination`)

| #   | Library surface                                     | Demonstrated in                                              | Status |
| --- | ---------------------------------------------------- | -------------------------------------------------------------- | ------ |
| 43  | `normalizePageQuery` (defaults + clamps)             | `GET /catalog/products` (page/limit echoed in `meta`)          | ✅     |
| 44  | `PageQuery` / `PageMeta` / `PageResult<T>`           | catalog offset endpoint + dashboard table                      | ✅     |
| 45  | `buildPageResult` (totalPages derivation)            | catalog offset endpoint                                        | ✅     |
| 46  | `encodeCursor` / opaque base64url                    | catalog cursor endpoint (`nextCursor` in responses)            | ✅     |
| 47  | `decodeCursor` strict rejection (`BYMAX_VALIDATION_FAILED`) | "Corrupt the cursor" button on the Pagination page + E2E  | ✅     |
| 48  | `normalizeCursorQuery`                               | catalog cursor endpoint                                        | ✅     |
| 49  | `CursorQuery` / `CursorResult<T>`                    | catalog cursor endpoint + dashboard infinite table             | ✅     |
| 50  | `buildCursorResult` (fetch-one-extra, `nextCursor: null` at end) | walking the seeded catalog to the last page          | ✅     |
| 51  | ORM neutrality (helpers over an in-memory repository) | `catalog/product.repository.ts` (no ORM anywhere)             | ✅     |

### 7.6 Health (`./health`)

| #   | Library surface                                    | Demonstrated in                                                | Status |
| --- | --------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| 52  | `GET /health/live` (200, empty checks)              | Health Console + E2E                                              | ✅     |
| 53  | `GET /health/ready` 200 all-up / 503 any-down       | toggleable `flaky` indicator flips the status live                | ✅     |
| 54  | Health response contract (`status` + `checks[]`)    | pinned contract E2E + Console rendering                           | ✅     |
| 55  | `IHealthIndicator` implementations                  | `event-loop` (always up, latency detail) + `flaky` + `hanging`    | ✅     |
| 56  | `HealthIndicatorResult` with `details`              | latency and diagnostic details rendered per check                 | ✅     |
| 57  | `indicatorTimeoutMs` → hung indicator reported down | the `hanging` indicator sleeps past the timeout; E2E asserts the diagnostic detail | ✅ |
| 58  | Concurrent aggregation, one failure hides nothing   | with `flaky` down, `event-loop` still reports up in the same response | ✅  |
| 59  | `health.path` custom prefix                         | E2E variant boots with `path: 'status'`                            | ✅     |

### 7.7 Metrics

| #   | Library surface                                       | Demonstrated in                                                | Status |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------- | ------ |
| 60  | `metrics.enabled` gating (default disabled)            | E2E: default config has no `/metrics` route (404)                 | ✅     |
| 61  | Lazy `prom-client` loading (never loaded when disabled) | E2E proof: with metrics disabled, `require.cache` holds no prom-client module | ✅ |
| 62  | Missing-peer fail-fast (descriptive boot error)         | documented + asserted in an isolated E2E with a mocked resolver   | ✅     |
| 63  | `http_requests_total` counter                           | Metrics page: fire traffic, watch the counter grow                | ✅     |
| 64  | `http_request_duration_seconds` histogram               | Metrics page: buckets rendered after the Latency Lab runs         | ✅     |
| 65  | Bounded labels (`method` / `route` / `status_code`)     | scrape output inspected; varied ids collapse to one route label   | ✅     |
| 66  | `metrics.defaultLabels`                                 | `app="nest-core-example"` visible on every metric line            | ✅     |
| 67  | `metrics.collectDefaultMetrics`                         | process metrics present in the scrape                              | ✅     |
| 68  | `metrics.path` custom route                             | E2E variant serves at `/telemetry`                                  | ✅     |
| 69  | Custom app metric via `BYMAX_METRICS_REGISTRY`          | `metrics-demo` `catalog_lookups_total` counter                      | ✅     |
| 70  | Prometheus scrape compatibility                          | optional `--profile tools` Prometheus targets the API               | ✅     |

---

## 8 · Library Consumption

The example consumes `@bymax-one/nest-core` as a packed external package, **not** a workspace
member. The library is not published to npm for now, so the dependency uses the `file:`
protocol pointing at the sibling checkout: pnpm packs the directory respecting the library's
`files` and `exports` fields, so the example still validates the packaged `exports` map
(three subpaths, dual ESM + CJS), not a local `src/`.

### 8.1 The consumption gate

The consuming phases of the plan require the local library to be **built**:

```bash
# from this repo's root - all three subpath type entries must exist
test -f ../nest-core/dist/index.d.ts \
  && test -f ../nest-core/dist/pagination/index.d.ts \
  && test -f ../nest-core/dist/health/index.d.ts     # exit 0 → consumption unblocked
```

If it fails, the operator rebuilds with `pnpm -C ../nest-core build`. After any library
rebuild, a fresh `pnpm install` in this repo is required for the repacked `file:` dependency
to be picked up. The dependency block:

```jsonc
// apps/api/package.json
"dependencies": {
  "@bymax-one/nest-core": "file:../../../nest-core",
  // The library's REQUIRED peers live here so they resolve to a single copy:
  "@nestjs/common": "^11",
  "@nestjs/core": "^11",
  "reflect-metadata": "^0.2",
  "rxjs": "^7",
  // OPTIONAL peer, installed because this example enables metrics:
  "prom-client": "^15"
}
```

> 🎓 **Why `file:` and not a workspace package, a `link:`, or a `paths` alias.** The latter
> would short-circuit the packaged `exports` map and resolve library sources directly, hiding
> subpath, `.d.ts`, and dual-build regressions. The `file:` install packs and resolves through
> `dist/` + `package.json#exports` exactly as a real npm consumer does; when the library
> publishes, the dependency flips to `^0.1.0` with no other change.

### 8.2 Subpath imports

```ts
// Root subpath: module, filter, interceptor, tokens, interfaces, error codes
import {
  BymaxCoreModule,
  BYMAX_CORRELATION_PROVIDER,
  BYMAX_TIMING_SINK,
  BYMAX_HEALTH_INDICATORS,
  BYMAX_METRICS_REGISTRY,
  type BymaxCoreModuleOptions,
  type ICorrelationIdProvider,
  type ITimingSink,
  type RequestTimingSample,
} from '@bymax-one/nest-core'

// Pagination subpath: pure helpers, no providers
import {
  normalizePageQuery,
  buildPageResult,
  normalizeCursorQuery,
  buildCursorResult,
  encodeCursor,
  decodeCursor,
  type PageResult,
  type CursorResult,
} from '@bymax-one/nest-core/pagination'

// Health subpath: contracts only
import type { IHealthIndicator, HealthIndicatorResult } from '@bymax-one/nest-core/health'
```

A typed subpath probe (created in the consumption phase) imports from all three subpaths so
`pnpm typecheck` fails loudly if the exports map regresses.

---

## 9 · Configuration & Environment

### 9.1 Environment variables (`apps/api`)

All env access goes through a Zod-validated, typed `ConfigService<Env, true>`. No raw
`process.env` in feature code.

| Variable                      | Default (dev)           | Purpose                                                |
| ----------------------------- | ----------------------- | ------------------------------------------------------- |
| `NODE_ENV`                    | `development`           | gates `exposeInternals` and the prod-collapse demo      |
| `PORT`                        | `3001`                  | API HTTP port                                            |
| `WEB_ORIGIN`                  | `http://localhost:3000` | CORS allow-list for the dashboard                        |
| `ENVELOPE_EXPOSE_INTERNALS`   | `true` (dev only)       | maps to `envelope.exposeInternals`                       |
| `TIMING_SLOW_THRESHOLD_MS`    | `500`                   | maps to `timing.slowRequestThresholdMs`                  |
| `TIMING_BUFFER_SIZE`          | `500`                   | ring-buffer capacity of the demo sink                    |
| `HEALTH_PATH`                 | `health`                | maps to `health.path`                                    |
| `HEALTH_INDICATOR_TIMEOUT_MS` | `2000`                  | maps to `health.indicatorTimeoutMs` (short, demo-friendly) |
| `METRICS_ENABLED`             | `true`                  | maps to `metrics.enabled` (the example showcases metrics) |
| `METRICS_PATH`                | `metrics`               | maps to `metrics.path`                                    |
| `CATALOG_SEED_COUNT`          | `240`                   | products seeded into the in-memory catalog                |
| `CATALOG_ORIGIN_LATENCY_MS`   | `120`                   | artificial repository latency (makes timing visible)      |

`apps/web`: `NEXT_PUBLIC_API_URL=http://localhost:3001`.

### 9.2 The canonical wiring: `core/core.config.ts`

The project's headline copy-paste artifact. It separates what the options are from how the
module is wired:

```ts
/**
 * Builds the resolved options for BymaxCoreModule from validated env.
 * @param config - Typed config service over the Zod-validated Env.
 * @returns Fully formed BymaxCoreModuleOptions.
 */
export function buildCoreOptions(config: ConfigService<Env, true>): BymaxCoreModuleOptions {
  return {
    envelope: {
      enabled: true,
      exposeInternals: config.get('ENVELOPE_EXPOSE_INTERNALS', { infer: true }),
    },
    timing: {
      enabled: true,
      slowRequestThresholdMs: config.get('TIMING_SLOW_THRESHOLD_MS', { infer: true }),
    },
    health: {
      enabled: true,
      path: config.get('HEALTH_PATH', { infer: true }),
      indicatorTimeoutMs: config.get('HEALTH_INDICATOR_TIMEOUT_MS', { infer: true }),
    },
    metrics: {
      enabled: config.get('METRICS_ENABLED', { infer: true }),
      path: config.get('METRICS_PATH', { infer: true }),
      defaultLabels: { app: 'nest-core-example' },
    },
  }
}
```

```ts
// app.module.ts: async registration (isGlobal is decided synchronously by the builder,
// so it is passed at the call site, never returned from useFactory)
BymaxCoreModule.forRootAsync({
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) => buildCoreOptions(config),
})
```

The library's Symbol-token providers are bound in `core/core.module.ts`:

```ts
@Module({
  providers: [
    RequestContextService,
    RingBufferTimingSink,
    { provide: BYMAX_CORRELATION_PROVIDER, useExisting: RequestContextService },
    { provide: BYMAX_TIMING_SINK, useExisting: RingBufferTimingSink },
    { provide: BYMAX_HEALTH_INDICATORS, useClass: EventLoopHealthIndicator, multi: true },
    { provide: BYMAX_HEALTH_INDICATORS, useExisting: FlakyHealthIndicator, multi: true },
    { provide: BYMAX_HEALTH_INDICATORS, useExisting: HangingHealthIndicator, multi: true },
  ],
  exports: [RequestContextService, RingBufferTimingSink],
})
export class CoreWiringModule {}
```

> 🎓 **Production pairing.** In a real Bymax service the correlation provider is satisfied by
> `@bymax-one/nest-logger`'s AsyncLocalStorage log context with a one-line `useExisting`. This
> example ships its own minimal `RequestContextService` so the demonstration stands alone and
> the contract (`getCorrelationId(): string | undefined`) is visible in full.

---

## 10 · Backend Design: `apps/api`

### 10.1 Module map & responsibilities

| Module         | Responsibility                                                     | Primary library surface                                          |
| -------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `config`       | Zod env schema + `validateEnv()`                                    | (none)                                                            |
| `core`         | `forRootAsync` wiring, correlation provider, timing sink, indicators | module, all five tokens, `ICorrelationIdProvider`, `ITimingSink` |
| `common`       | `ZodValidationPipe`, domain error classes with custom codes         | validation mapping, `code` passthrough                            |
| `catalog`      | Seeded in-memory product domain                                     | `./pagination` (offset + cursor), `BYMAX_NOT_FOUND`               |
| `failures`     | Trigger every `BYMAX_*` derivation on demand                        | the full code catalog, unknown collapse, `exposeInternals`        |
| `latency`      | Artificial-delay endpoint                                           | `slow` flag, histogram buckets                                    |
| `timing-feed`  | Expose the ring-buffer sink content                                 | `RequestTimingSample`, `BYMAX_CORE_OPTIONS` (threshold display)   |
| `health-demo`  | Toggleable indicator state                                          | `IHealthIndicator`, timeout semantics                              |
| `metrics-demo` | Custom counter against the injected registry                        | `BYMAX_METRICS_REGISTRY`                                           |

### 10.2 Controller/service shape (the house style)

Thin controllers, JSDoc on every public method, Zod DTOs, business logic in services:

```ts
/**
 * Seeded product catalog demonstrating both pagination models over an
 * in-memory repository (the library is ORM-agnostic; so is this demo).
 */
@Injectable()
export class CatalogService {
  constructor(private readonly products: ProductRepository) {}

  /**
   * Lists products with offset pagination.
   * @param raw - Unvalidated query input (page, limit).
   * @returns A PageResult with clamped meta derived by the library helpers.
   */
  async listOffset(raw: Record<string, unknown>): Promise<PageResult<Product>> {
    const query = normalizePageQuery(raw, { maxLimit: 50 })
    const { rows, total } = await this.products.findPage(query)
    return buildPageResult(rows, total, query)
  }
}
```

### 10.3 Request context (correlation)

A tiny middleware assigns a `crypto.randomUUID()` request id into an `AsyncLocalStorage` store;
`RequestContextService.getCorrelationId()` reads it back. The filter stamps it into every
envelope; the API also echoes it as an `x-request-id` response header so the dashboard can
display the pairing. This is the library's `ICorrelationIdProvider` contract implemented in
~30 lines, with JSDoc pointing at the production pairing (§9.2).

---

## 11 · Demo Domain & REST API

A deliberately tiny domain: an in-memory **product catalog** (seeded, deterministic, with
artificial origin latency so timing is visible). No database.

### 11.1 Endpoint catalogue

| Method & path                              | Demo                                | Library surface                                     |
| ------------------------------------------ | ----------------------------------- | ---------------------------------------------------- |
| `GET /catalog/products`                    | offset pagination                   | `normalizePageQuery` + `buildPageResult`             |
| `GET /catalog/products/cursor`             | cursor pagination                   | `normalizeCursorQuery` + `buildCursorResult` + codec |
| `GET /catalog/products/:id`                | single lookup (404 path)            | `BYMAX_NOT_FOUND` envelope                            |
| `POST /catalog/products`                   | Zod-validated create                | validation shape → `BYMAX_VALIDATION_FAILED`          |
| `GET /catalog/products/:id/seasonal`       | domain error with custom code       | explicit `code` passthrough                            |
| `POST /failures/:kind`                     | trigger each `BYMAX_*` derivation   | the full §7.3 catalog                                  |
| `GET /latency?ms=&poison=`                 | artificial delay (+ sink poison)    | `slow` flag, sink never-throws                         |
| `GET /timing/samples`                      | recent timing samples + threshold   | `RequestTimingSample`, `BYMAX_CORE_OPTIONS`            |
| `GET /health/live` · `GET /health/ready`   | library health endpoints            | liveness/readiness contract                             |
| `POST /health-demo/flaky?status=up\|down`  | toggle the flaky indicator          | readiness 200 ↔ 503                                    |
| `POST /health-demo/hang?enabled=`          | arm the hanging indicator           | `indicatorTimeoutMs` → down                             |
| `GET /metrics`                             | Prometheus text format              | full metrics surface                                     |
| `POST /metrics-demo/lookup`                | increment the custom counter        | `BYMAX_METRICS_REGISTRY`                                 |

### 11.2 Documented journeys

The README includes curl walkthroughs that double as manual smoke tests: the envelope contract
tour (one request per code family), the slow-request run, the cursor walk to `nextCursor: null`,
the corrupted-cursor rejection, the readiness flip, and the metrics growth check.

---

## 12 · Demonstration Scenarios

Each scenario states **what it shows**, the **library APIs**, the **UI**, and an honest
**design note** where the library has a boundary worth teaching.

### 12.1 Error Envelope Playground

- **Shows:** every `BYMAX_*` derivation produced on demand; the exact 7-field contract; the
  custom-code passthrough; the dev-vs-prod difference for unknown errors.
- **APIs:** filter mapping rules, `exposeInternals`, `ICorrelationIdProvider`.
- **UI (`/errors`):** a trigger grid (one card per code), a response panel rendering the raw
  envelope JSON with field annotations, and a "prod mode" comparison that shows the same unknown
  error collapsed with no stack.
- **Design note:** the filter is HTTP-first; GraphQL/RPC contexts are out of scope for the
  library's initial release and the example states that rather than faking it.

### 12.2 Latency Lab

- **Shows:** wall-clock timing per request, the route template (bounded cardinality), the
  `slow` flag crossing the threshold, error statuses recorded, and the sink's never-throw rule.
- **APIs:** `TimingInterceptor`, `ITimingSink`, `RequestTimingSample`, `BYMAX_CORE_OPTIONS`.
- **UI (`/latency`):** a "fire request" control with a delay slider, a live samples table
  (method, route, status, duration, slow badge), a duration sparkline, and a "poison the sink"
  toggle proving a throwing sink never breaks a request.

### 12.3 Pagination: offset and cursor, side by side

- **Shows:** clamped offset queries with derived meta; opaque cursors walking the catalog to the
  final `nextCursor: null`; strict rejection of corrupted cursors.
- **APIs:** the entire `./pagination` subpath.
- **UI (`/pagination`):** two tabs. Offset: a classic numbered table with page/limit controls and
  the `meta` object displayed. Cursor: an infinite "load more" table showing each opaque cursor,
  plus a "corrupt the cursor" button that sends a tampered string and renders the resulting
  `BYMAX_VALIDATION_FAILED` envelope.
- **Design note:** cursors are opaque but not signed; the UI labels them "ordering keys only,
  never secrets", mirroring the library's known limitation.

### 12.4 Health Console

- **Shows:** liveness vs readiness; the aggregation contract; per-indicator details; timeouts
  reported as `down` with diagnostics; one failing indicator hiding nothing.
- **APIs:** the entire `./health` subpath + `indicatorTimeoutMs`.
- **UI (`/health`):** live/ready status tiles polling the real endpoints, a check list with
  per-indicator status and details, and toggle switches for the `flaky` and `hanging` demo
  indicators; flipping `flaky` turns readiness 503 in front of the user.

### 12.5 Metrics View

- **Shows:** the lazy registry, default HTTP metrics fed by the timing bridge, bounded labels,
  default labels, process metrics, and a custom application counter.
- **APIs:** the entire metrics surface + `BYMAX_METRICS_REGISTRY`.
- **UI (`/metrics`):** a raw scrape panel (mono, refreshable) and a parsed panel highlighting
  `http_requests_total`, the duration histogram buckets, and `catalog_lookups_total`; an inline
  note explains the disabled-by-default stance and what a 404 here means.

---

## 13 · Frontend Design: `apps/web`

A Next.js 16 (App Router) dashboard, **visually identical** to the other Bymax example apps
(§14). It is a thin client over the API.

### 13.1 Data layer

- **Server state:** TanStack Query v5; `useQuery` for reads (samples, health, metrics, catalog
  pages), `useMutation` for writes (failure triggers, toggles), with `invalidateQueries` after
  mutations.
- **Typed transport:** `lib/api-client.ts` is a thin `fetch` wrapper returning typed results and
  mapping error bodies to a discriminated union over the mirrored `ErrorEnvelope` type
  (`lib/envelope.ts`). The envelope type and the `BYMAX_*` code list are mirrored constants with
  a unit test pinning them against the documented contract, so any library drift fails loudly.
- **Polling over sockets:** live feels (samples, health) use bounded `refetchInterval` polling;
  the library has no realtime surface and the example does not invent one.

### 13.2 Pages

| Route         | Page               | Demonstrates                                                   |
| ------------- | ------------------ | --------------------------------------------------------------- |
| `/`           | Overview           | status strip (health, request count, slow count, error count), quick links, library summary |
| `/errors`     | Envelope Playground | matrix rows 12-36                                              |
| `/latency`    | Latency Lab        | matrix rows 37-42                                               |
| `/pagination` | Pagination         | matrix rows 43-51                                               |
| `/health`     | Health Console     | matrix rows 52-59                                               |
| `/metrics`    | Metrics View       | matrix rows 60-70                                               |

### 13.3 Signature components

`StatTile` (KPI), glass `Card`, pill `Button`, `Badge`/chip, `StatusChip` (health status →
color/icon/label), `Table` (mono), `Tabs`, `Toast` (sonner), `EmptyState`, `Skeleton`, and four
bespoke ones: **`EnvelopeViewer`** (annotated JSON contract), **`SampleFeed`** (timing table
with slow badges), **`CursorTrail`** (the chain of opaque cursors walked so far), and
**`CheckList`** (health checks with per-indicator toggles).

---

## 14 · Design System

The dashboard uses the **shared, project-agnostic Bymax design system**, whose source of truth
is [`docs/design_system.html`](./design_system.html) (open it in a browser; it renders the full
system offline and ends with an AI-agent recreation guide). **Do not invent a new visual
language**: the goal is that any two Bymax example apps look like one product.

- **Forced dark.** `dark` on `<html>`; no `next-themes`, no theme toggle.
- **Brand orange** `#ff6224` (`hsl(20.5 90.2% 57.8%)`): primary, ring, active nav, button
  gradient (`from-brand-500 to-brand-600`) with the hover glow `0 0 24px rgba(255,98,36,0.4)`.
- **Glass-morphism** surfaces: `rgba(255,255,255,0.06)` background, `1px rgba(255,255,255,0.10)`
  border, `backdrop-blur-md`, `rounded-2xl`.
- **Typography:** Geist Sans for prose, labels, and controls; monospace for headings, the brand
  wordmark, card titles, metric values, envelope JSON, cursors, and table cells.
- **8-pt spacing rhythm**, pill controls, `2xl` cards, `24px` hero radius.
- **Shell:** 64px topbar + 250px grouped sidebar (orange active state); brand wordmark
  `nest-core-example`.

---

## 15 · Error Handling

The library's exception filter **is** the application's error handling; the example adds nothing
on top, which is itself the demonstration. Rules the example proves:

1. Every controller error, framework error, and unknown throw leaves the API as the 7-field
   envelope. A pinned E2E snapshot guards the exact shape.
2. Domain errors carry custom codes via the exception response object (`code` passthrough); the
   `BYMAX_` prefix is never used for application codes.
3. `ZodValidationPipe` rejections surface as `BYMAX_VALIDATION_FAILED` with one structured
   `details` entry per issue.
4. In production mode (`NODE_ENV=production`, `exposeInternals=false`) an unknown error yields
   the fixed message and no stack; the E2E suite boots a prod-mode variant to assert the
   collapse.
5. The dashboard treats any non-envelope response as a bug and renders it as such.

---

## 16 · Observability

- **Timing:** the `RingBufferTimingSink` (bounded, default 500 samples) is the demo sink;
  `GET /timing/samples` exposes it with the resolved slow threshold read from
  `BYMAX_CORE_OPTIONS`. The sink implementation documents the never-throw contract and is
  poisonable on demand for the proof.
- **Correlation:** every envelope and every response carries the request id
  (`correlationId` field, `x-request-id` header); the Latency Lab shows the pairing.
- **Metrics:** enabled in the example's default configuration to showcase the surface; the E2E
  suite additionally boots the disabled variant to prove the zero-cost path (no route, no
  prom-client module loaded).
- **Optional Prometheus:** `docker compose --profile tools up` starts a Prometheus scraping the
  API every 5s; the README shows the target status page. Nothing in the app depends on it.

---

## 17 · Local Stack & Docker

**Zero mandatory infrastructure.** `pnpm dev` runs both apps with no containers. One optional
profile:

```yaml
# docker-compose.yml (excerpt): everything is optional
services:
  prometheus:
    image: prom/prometheus:v3.4.0
    profiles: ['tools']
    ports: ['127.0.0.1:9090:9090']
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
```

`docker/prometheus/prometheus.yml` targets `host.docker.internal:3001/metrics` with a 5s scrape
interval and is commented for learners.

---

## 18 · Testing Strategy

The example is the reference implementation other projects copy, so it holds the sibling bar:

| Tier          | Tool                                        | Scope & threshold                                                     |
| ------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| API unit      | Jest                                        | every service, controller, pipe, sink, indicator, config builder; **100% on all four metrics** |
| API E2E       | Jest + `@nestjs/testing` + `supertest`      | every route, every `BYMAX_*` code, both registration paths (`forRoot` sync in the test module, `forRootAsync` in the app), the disabled-feature variants (no health route, no metrics route, envelope off, timing off), the prod-collapse variant, the custom `health.path`/`metrics.path` variants, the never-loaded prom-client proof |
| Web unit      | Vitest + Testing Library                    | `lib/**`, `hooks/**`, presentational components; **100%**; mirrored envelope constants pinned |
| Web build     | `next build`                                | must succeed in CI                                                      |
| Mutation      | Stryker (api + web)                         | pre-release hardening phase; api `break: 100`, web `break: 90` (lib code held to 100) |
| Export audit  | `scripts/audit-library-exports.mjs`         | every shipped export demonstrated or ignored with a written reason      |

Test-execution safety: Jest and Vitest both pin `maxWorkers: '50%'`; suites run sequentially
(never two packages' suites at once); every `it()` carries a scenario comment.

---

## 19 · Tooling & Conventions

- pnpm workspaces (`apps/*`), `packageManager` pinned, `.nvmrc` = 24, `engines.node >= 24`.
- TypeScript 5.9 strict everywhere (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`);
  no `any`, no suppression comments.
- ESLint 9 flat config + Prettier; husky + lint-staged + commitlint (Conventional Commits,
  enforced locally and in CI).
- **No Swagger.** Controllers are documented with JSDoc; DTOs are Zod. The dashboard plus the
  README curl journeys are the interactive surface.
- Functions ≤ 50 lines; files ≤ 800 (200-400 typical); `@fileoverview` + `@layer` header on
  every file; JSDoc on every export.
- Comments are timeless: they explain what and why, never which plan phase created them.
- **CI from day one.** `.github/workflows/ci.yml` lands in Phase 0 (install, lint, typecheck,
  build, test with `--passWithNoTests` until the first suite exists, then hardened). CodeQL and
  OpenSSF Scorecard workflows ship **conditionally enabled**: they activate when the repository
  becomes public and are inert while it is private.
- Renovate: grouped `@bymax-one/**` rule (automerge minor/patch after green CI, majors labeled).

---

## 20 · Security & Safety

- **No secrets.** The example needs none; `.env.example` contains only non-sensitive defaults,
  and the secret-scan stays clean.
- **Production-safe demos.** `exposeInternals` is wired to `NODE_ENV !== 'production'`; the
  failure-injection endpoints are inherently safe (they only produce error responses) and the
  README states they must not ship in a real service.
- **Cursor hygiene.** Cursors encode ordering keys only; the UI and JSDoc repeat the library's
  rule that cursors are unsigned and must never carry sensitive data.
- **CORS** restricted to `WEB_ORIGIN`. **Rate limiting** out of scope (documented).
- Supply chain: committed lockfile, `pnpm install --frozen-lockfile` in CI, SHA-pinned actions,
  least-privilege workflow permissions, dependency review on PRs.

---

## 21 · Phased Delivery Plan

Coarse outline; the authoritative decomposition with tasks lives in
[`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md).

| Phase | Theme                                                        |
| ----- | ------------------------------------------------------------ |
| 0     | Repository foundation, tooling, CI from day one               |
| 1     | Library consumption (externally gated on npm publish) + subpath probes |
| 2     | API skeleton + core wiring (envelope, timing, correlation)    |
| 3     | Catalog domain + offset and cursor pagination                 |
| 4     | Failure injection (full code catalog) + Latency Lab backend   |
| 5     | Health indicators + metrics (+ optional Prometheus profile)   |
| 6     | Dashboard: shell, design system, all six pages                |
| 7     | Testing to the reference bar (100% unit, full E2E, variants)  |
| 8     | Mutation hardening, docs, README, export audit                |

---

## 22 · What This Project Intentionally Excludes

| Concern                        | Why excluded                                              |
| ------------------------------ | ---------------------------------------------------------- |
| Authentication / authorization | `@bymax-one/nest-auth`'s domain; its example covers it     |
| Logging engine / transports    | `@bymax-one/nest-logger`'s domain; pairing documented only |
| Redis / caching                | `@bymax-one/nest-cache`'s domain                            |
| Database / ORM                 | the library is ORM-agnostic; an in-memory repo proves it    |
| GraphQL / RPC error mapping    | outside the library's initial HTTP-first scope              |
| Rate limiting / i18n           | application concerns, out of the library's scope            |
| Kubernetes / deployment        | local reference only                                        |

---

## 23 · References

- Library repository: `github.com/bymaxone/nest-core` (technical specification and development
  plan live there; this document mirrors its published contract).
- Sibling reference apps: `nest-auth-example`, `nest-logger-example`, `nest-cache-example`
  (repository standard, design system, testing bar).
- Prometheus exposition format and `prom-client` documentation (metrics assertions).
- NestJS 11 documentation: exception filters, interceptors, `ConfigurableModuleBuilder`.

---

## 24 · Document Status

| Aspect        | State                                                             |
| ------------- | ------------------------------------------------------------------ |
| Version       | 1.0.0                                                              |
| Last updated  | 2026-07-06                                                         |
| Status        | Authoritative blueprint, authored before implementation            |
| Supersedes    | nothing (first document of this repository)                        |
| Reconciliation | On library publish, §4 signatures are re-verified against the shipped `.d.ts` files; drift is corrected here first, then propagated to the plan and tasks |
