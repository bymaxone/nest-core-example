<p align="center">
  <img src="https://img.shields.io/badge/%40bymax--one-nest--core--example-000000?style=for-the-badge&logo=nestjs&logoColor=E0234E" alt="nest-core-example" />
</p>

<h1 align="center">nest-core-example</h1>

<p align="center">
  <strong>Reference application for <a href="https://github.com/bymaxone/nest-core"><code>@bymax-one/nest-core</code></a></strong><br />
  <sub>NestJS 11 &middot; Next.js 16 &middot; TypeScript strict &middot; Zod &middot; error envelope &middot; pagination &middot; health &middot; metrics</sub>
</p>

<p align="center">
  <a href="https://github.com/bymaxone/nest-core-example/actions/workflows/ci.yml"><img src="https://github.com/bymaxone/nest-core-example/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/bymaxone/nest-core-example/blob/main/LICENSE"><img src="https://img.shields.io/github/license/bymaxone/nest-core-example?style=flat-square&colorA=000000&colorB=000000" alt="license" /></a>
  <a href="https://github.com/bymaxone/nest-core"><img src="https://img.shields.io/badge/%40bymax--one%2Fnest--core-0.1.0-E0234E?style=flat-square" alt="@bymax-one/nest-core 0.1.0" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript strict" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-24%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 24+" /></a>
</p>

---

## Overview

`@bymax-one/nest-core` is the **what**; this repository is the **how**. It demonstrates every
public export of the library, error envelopes, the timing interceptor, offset and cursor
pagination, the health aggregator, and the metrics endpoint, inside one runnable NestJS 11 API
and a Next.js 16 observability dashboard, so a reader can see the library's behavior instead of
reading it from a README alone.

The library is consumed exactly as a real downstream app would: `apps/api` depends on it via
`"@bymax-one/nest-core": "file:../../../nest-core"`, which packs the library respecting its
`files`/`exports` map. No database and no infrastructure: the catalog is an in-memory, seeded,
deterministic repository.

## What's inside

Every row maps to the [Feature Coverage Matrix](docs/TECHNICAL_SPECIFICATION.md#7--feature-coverage-matrix),
and a [CI export audit](scripts/audit-library-exports.mjs) fails the build if any shipped export
stops being demonstrated.

- **Error envelope** &mdash; the exact 7-field contract on every error, the full `BYMAX_*` code
  catalog (including the unmapped-4xx and unmapped-5xx fallbacks and the unknown-throw collapse),
  custom domain-code passthrough, and the dev-vs-prod `exposeInternals` contrast.
- **Request timing** &mdash; the timing interceptor's route-template samples, the `slow` flag
  crossing the configured threshold, and the fire-and-forget sink that a throwing sink can never
  break.
- **Pagination** (`./pagination`) &mdash; offset (clamped `page`/`limit` with derived meta) and
  opaque-cursor pagination walked to `nextCursor: null`, plus strict rejection of a tampered
  cursor.
- **Health** (`./health`) &mdash; liveness and readiness, a multi-indicator aggregate that flips
  `200`&harr;`503` live, per-indicator details, and a hung indicator reported down by timeout.
- **Metrics** &mdash; the lazy `prom-client` registry, default HTTP metrics with bounded labels,
  default labels, process metrics, and a custom application counter.
- **The reference bar** &mdash; 100% unit coverage on both apps, E2E of every route and config
  variant, Stryker mutation (api `break: 100`, web `break: 90` with `lib/**` at 100), and the
  export audit &mdash; all gated in CI.

## Quick start

Requires Node `>= 24` and pnpm `>= 10`. No database, no Docker.

```bash
pnpm install
# the API boots on its documented defaults with no .env; the web app needs its API URL:
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

- API &rarr; <http://localhost:3001> (health at <http://localhost:3001/health/live>)
- Dashboard &rarr; <http://localhost:3000>

An optional Prometheus + Grafana profile is available with `pnpm tools:up` (see
[docker-compose.yml](docker-compose.yml)); it is not required to run the demo.

## Endpoints

| Method &amp; path                               | Demo                              | Library surface                                      |
| ----------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `GET /catalog/products`                         | offset pagination                 | `normalizePageQuery` + `buildPageResult`             |
| `GET /catalog/products/cursor`                  | cursor pagination                 | `normalizeCursorQuery` + `buildCursorResult` + codec |
| `GET /catalog/products/:id`                     | single lookup (404 path)          | `BYMAX_NOT_FOUND` envelope                           |
| `POST /catalog/products`                        | Zod-validated create              | validation shape &rarr; `BYMAX_VALIDATION_FAILED`    |
| `GET /catalog/products/:id/seasonal`            | domain error with custom code     | explicit `code` passthrough                          |
| `POST /failures/:kind`                          | trigger each `BYMAX_*` derivation | the full error-code catalog                          |
| `GET /latency?ms=&poison=`                      | artificial delay (+ sink poison)  | `slow` flag, sink never-throws                       |
| `GET /timing/samples`                           | recent timing samples + threshold | `RequestTimingSample`, `BYMAX_CORE_OPTIONS`          |
| `GET /health/live` &middot; `GET /health/ready` | library health endpoints          | liveness/readiness contract                          |
| `POST /health-demo/flaky?status=up\|down`       | toggle the flaky indicator        | readiness `200`&harr;`503`                           |
| `POST /health-demo/hang?enabled=`               | arm the hanging indicator         | `indicatorTimeoutMs` &rarr; down                     |
| `GET /metrics`                                  | Prometheus text format            | full metrics surface                                 |
| `POST /metrics-demo/lookup`                     | increment the custom counter      | `BYMAX_METRICS_REGISTRY`                             |

## Journeys

Five `curl` walkthroughs that double as a manual smoke test. Outputs are real and trimmed;
`correlationId` and `timestamp` vary per request.

### 1. The error envelope, one shape for every failure

```bash
curl -s localhost:3001/catalog/products/nope             # unknown id
curl -s -X POST localhost:3001/failures/forbidden        # a mapped HttpException
curl -s -X POST localhost:3001/catalog/products -H 'content-type: application/json' -d '{}'
```

Every error is the same 7-field envelope; validation adds a structured `details` array:

```jsonc
// GET /catalog/products/nope
{ "statusCode": 404, "code": "BYMAX_NOT_FOUND", "message": "Product nope was not found",
  "timestamp": "…", "path": "/catalog/products/nope", "correlationId": "…" }

// POST /catalog/products {}
{ "statusCode": 400, "code": "BYMAX_VALIDATION_FAILED", "message": "Validation failed",
  "details": [
    { "path": "name", "message": "Invalid input: expected string, received undefined" },
    { "path": "category", "message": "Invalid input: expected string, received undefined" },
    { "path": "priceCents", "message": "Invalid input: expected number, received undefined" }
  ], "timestamp": "…", "path": "/catalog/products", "correlationId": "…" }
```

### 2. A slow request crosses the threshold

```bash
curl -s "localhost:3001/latency?ms=800"
curl -s localhost:3001/timing/samples
```

`elapsedMs` is measured from the monotonic clock; the recorded sample carries the route template
and the `slow` flag because `800 > TIMING_SLOW_THRESHOLD_MS` (500):

```jsonc
// GET /latency?ms=800
{ "requestedMs": 800, "elapsedMs": 800, "poisoned": false }

// last GET /timing/samples entry
{ "method": "GET", "route": "/latency", "statusCode": 200, "durationMs": 800.29, "slow": true }
```

### 3. Cursor pagination, walked and tampered with

```bash
curl -s "localhost:3001/catalog/products/cursor?limit=2"
curl -s "localhost:3001/catalog/products/cursor?cursor=not-a-valid-cursor"
```

The cursor is opaque base64url over ordering keys only (`echo eyJpZCI6InAtMDAwMDAyIn0 | base64 -d`
&rarr; `{"id":"p-000002"}`); pass it back as `?cursor=` to fetch the next page, and the walk ends
with `nextCursor: null`. A tampered cursor is rejected as a validation error, never an internal
one:

```jsonc
// GET /catalog/products/cursor?limit=2
{ "items": [ { "id": "p-000001", … }, { "id": "p-000002", … } ],
  "nextCursor": "eyJpZCI6InAtMDAwMDAyIn0" }

// GET /catalog/products/cursor?cursor=not-a-valid-cursor
{ "statusCode": 400, "code": "BYMAX_VALIDATION_FAILED", "message": "Malformed pagination cursor.", … }
```

### 4. Readiness flips live

```bash
curl -s -X POST "localhost:3001/health-demo/flaky?status=down"
curl -s -o /dev/null -w '%{http_code}\n' localhost:3001/health/ready   # 503
curl -s -X POST "localhost:3001/health-demo/flaky?status=up"
curl -s -o /dev/null -w '%{http_code}\n' localhost:3001/health/ready   # 200
```

With the `flaky` indicator down, readiness is `503` and its body reports exactly which check
failed while the others stay up:

```jsonc
// GET /health/ready (flaky down) -> HTTP 503
{
  "status": "error",
  "checks": [
    { "name": "event-loop", "status": "up", "details": { "lagMs": 0.023 } },
    { "name": "flaky", "status": "down", "details": { "toggledAt": "…" } },
    { "name": "hanging", "status": "up" },
  ],
}
```

### 5. The custom metric grows

```bash
curl -s localhost:3001/metrics | grep catalog_lookups_total   # (absent until first lookup)
curl -s -X POST localhost:3001/metrics-demo/lookup            # -> { "metric": "catalog_lookups_total", "total": 1 }
curl -s localhost:3001/metrics | grep catalog_lookups_total   # catalog_lookups_total{app="nest-core-example"} 1
```

HTTP metrics collapse varied ids to one bounded route label, and every line carries the default
`app` label:

```text
http_requests_total{method="GET",route="/catalog/products/:id",status_code="404",app="nest-core-example"} 1
```

> **Safety note.** The `POST /failures/:kind` endpoints and the `?poison=` / hang toggles are
> demonstration-only: they exist purely to produce error and degraded states on demand and must
> **not** ship in a real service.

## Dashboard

A Next.js 16 App Router dashboard (`apps/web`), a thin client over the API, rendered in the
shared Bymax design system.

| Route                   | Page                | Demonstrates                                                          |
| ----------------------- | ------------------- | --------------------------------------------------------------------- |
| `/`                     | Landing page        | the public entry point; no shell, no query client                     |
| `/dashboard`            | Overview            | readiness, request/slow/error counts, quick links, library summary    |
| `/dashboard/errors`     | Envelope Playground | the envelope contract and every `BYMAX_*` code, dev-vs-prod collapse  |
| `/dashboard/latency`    | Latency Lab         | the slow flag, the samples feed, and the poison-the-sink proof        |
| `/dashboard/pagination` | Pagination          | offset and cursor tabs, the cursor trail, and the corrupt-cursor demo |
| `/dashboard/health`     | Health Console      | live/ready tiles, per-indicator checks, and the flaky/hang toggles    |
| `/dashboard/metrics`    | Metrics View        | the raw scrape and a parsed highlights panel                          |

## Architecture

```text
             pnpm workspace (apps/*)
  ┌───────────────────────────┐        ┌───────────────────────────┐
  │  apps/web (Next.js 16)     │  HTTP  │  apps/api (NestJS 11)      │
  │  dashboard, 6 pages        │ ─────▶ │  BymaxCoreModule wired     │
  │  mirrors the envelope type │  CORS  │  in-memory seeded catalog  │
  └───────────────────────────┘        └─────────────┬─────────────┘
                                                      │ file:../../../nest-core
                                                      ▼
                                        @bymax-one/nest-core (packed exports)
                                        .  ·  ./pagination  ·  ./health
```

## Documentation

- [`docs/TECHNICAL_SPECIFICATION.md`](docs/TECHNICAL_SPECIFICATION.md) &mdash; the authoritative
  architecture and API-contract blueprint (with the Feature Coverage Matrix).
- [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) &mdash; the phased execution roadmap and
  conventions.
- [`docs/tasks/README.md`](docs/tasks/README.md) &mdash; the per-phase task index for implementers.

## License

[MIT](LICENSE)
