# nest-core-example: Development Plan

> **Scope:** the master phased plan for building `nest-core-example`, the reference application
> for [`@bymax-one/nest-core`](https://github.com/bymaxone/nest-core).
> **Source of truth:** [`TECHNICAL_SPECIFICATION.md`](TECHNICAL_SPECIFICATION.md). This file is
> the execution roadmap that decomposes it; per-phase task files live under
> [`docs/tasks/`](tasks/).
> **Targeted library version:** `@bymax-one/nest-core@0.1.0`, consumed from the sibling local
> checkout via `file:../../../nest-core` (not yet published to npm; see the external
> precondition below).
> **Document version:** 1.0, authored before implementation.
> **Status legend (one legend everywhere):** 📋 ToDo · 🔄 In Progress · 👀 Review · ✅ Done · ⛔ Blocked · 🟡 Partial

---

## Table of Contents

- [Progress Dashboard](#progress-dashboard)
- [External Precondition](#external-precondition)
- [1. Phase Map & Dependencies](#1-phase-map--dependencies)
- [2. Parallelization Notes](#2-parallelization-notes)
- [3. Global Conventions](#3-global-conventions)
- [4. Per-Phase Detail](#4-per-phase-detail)
- [5. Update Protocol](#5-update-protocol)
- [Appendix A: Environment Variable Registry](#appendix-a-environment-variable-registry)
- [Appendix B: Quality Gates](#appendix-b-quality-gates)

---

## Progress Dashboard

> **Progress:** 0 / 9 phases complete (0%) · 5 / 42 tasks
> **Active phase:** Phase 0 (Repository Foundation & CI), PR open awaiting review and merge
> **Blocked:** none at kickoff - the sibling library is built and its `dist/` resolves, so
> Phase 1's external gate is satisfied. Phase 1 returns to ⛔ only if that local-build check
> regresses (see the [External Precondition](#external-precondition)).

| #  | Phase                                   | Tasks file                          | Size | Done / Total | Status |
| -- | ---------------------------------------- | ----------------------------------- | ---- | ------------ | ------ |
| 0  | Repository Foundation & CI               | `phase-00-repo-foundation.md`       | M    | 5 / 5        | 👀     |
| 1  | Library Consumption & Subpath Probes     | `phase-01-library-consumption.md`   | S    | 0 / 3        | 📋     |
| 2  | API Skeleton + Core Wiring               | `phase-02-api-skeleton-wiring.md`   | L    | 0 / 5        | 📋     |
| 3  | Catalog Domain & Pagination              | `phase-03-catalog-pagination.md`    | M    | 0 / 4        | 📋     |
| 4  | Failure Injection & Latency Lab (API)    | `phase-04-failures-latency.md`      | M    | 0 / 4        | 📋     |
| 5  | Health Indicators & Metrics (API)        | `phase-05-health-metrics.md`        | M    | 0 / 5        | 📋     |
| 6  | Dashboard: Shell + All Pages             | `phase-06-web-dashboard.md`         | L    | 0 / 6        | 📋     |
| 7  | Testing to the Reference Bar             | `phase-07-testing.md`               | L    | 0 / 5        | 📋     |
| 8  | Mutation, Docs, README & Export Audit    | `phase-08-hardening-docs.md`        | M    | 0 / 5        | 📋     |

## External Precondition

`@bymax-one/nest-core` is **ready in its sibling local checkout
(`../nest-core`) and is not published to npm for now**. The example consumes it via
`"@bymax-one/nest-core": "file:../../../nest-core"` in `apps/api` - the same pattern the
sibling `*-example` repos use. The `file:` protocol packs the library respecting its
`files` and `exports` fields, so the example still validates the packaged `exports` map
like a real consumer. Before starting Phase 1 (and any phase after it), verify the library
is built:

```bash
# from the repo root - all three subpath type entries must exist
test -f ../nest-core/dist/index.d.ts \
  && test -f ../nest-core/dist/pagination/index.d.ts \
  && test -f ../nest-core/dist/health/index.d.ts
```

While the check fails, Phase 1 stays ⛔ Blocked (name the missing build in the dashboard
notes) and the run stops cleanly; the operator builds the library with
`pnpm -C ../nest-core build`. This plan never consumes the library as a `workspace:` member,
a `link:` symlink, or a `paths` alias - and after any library rebuild, a fresh
`pnpm install` is required for the repacked `file:` dependency to be picked up.

---

## 1. Phase Map & Dependencies

```
0 ──▶ 1 ──▶ 2 ──┬──▶ 3 ──┐
(local build    ├──▶ 4 ──┼──▶ 6 ──▶ 7 ──▶ 8
 gate)          └──▶ 5 ──┘
```

**Critical path:** `0 → 1 → 2 → 3 → 6 → 7 → 8`.

- Phase 2 (skeleton + core wiring) unlocks the three API feature phases.
- Phases 3, 4, and 5 are **code-parallel** (disjoint modules) once Phase 2 lands.
- Phase 6 (dashboard) needs all three feature phases: its pages read their endpoints.
- Phases 7 and 8 are strictly sequential at the end (tests before hardening/docs).

## 2. Parallelization Notes

- Phases 3, 4, 5 may be developed in parallel **as code**; their PRs merge independently.
- **Test suites never run in parallel across packages.** One suite at a time; Jest and Vitest
  configs pin `maxWorkers: '50%'`; `NODE_OPTIONS=--max-old-space-size=4096` is the guard rail.
- One implementer per phase; two agents never share a working tree.
- Phase 6 may scaffold its shell against mocked endpoints while 4/5 finish, but its
  Definition of Done requires the real endpoints.

## 3. Global Conventions

| Concern         | Convention                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Package manager | pnpm (pinned via `packageManager`), workspaces `apps/*`                                          |
| Runtime         | Node `>= 24` (`.nvmrc`, `engines`, CI `node-version: 24`)                                        |
| Language        | TypeScript 5.9 strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`; zero `any`; no suppression comments |
| Lint / format   | ESLint 9 flat + Prettier; husky + lint-staged + commitlint (Conventional Commits)                 |
| Sizing          | functions ≤ 50 lines; files ≤ 800 (200-400 typical); `@fileoverview` + `@layer` header per file  |
| Comments        | English only, timeless (no plan-phase references in committed code or config)                     |
| API docs        | No Swagger; JSDoc on controllers; Zod DTOs                                                        |
| Library dep     | `@bymax-one/nest-core` via `file:../../../nest-core` (sibling local checkout, packed `exports` map); peers (`@nestjs/*`, `reflect-metadata`, `rxjs`) plus the optional `prom-client` installed in `apps/api` |
| Datastore       | none; the catalog is an in-memory seeded repository                                               |
| Branching       | one branch per phase: `git switch -c feat/phase-NN-<slug>` (never `git checkout -b`)              |
| PR flow         | one PR per phase; GitHub Copilot code review requested on every PR; all findings addressed; merge only with CI green; squash + delete branch |
| Attribution     | never add `Co-Authored-By`, "Generated with", or any AI-attribution line to commits or PRs        |
| CI              | present from Phase 0; `--passWithNoTests` removed when the first real suite lands; CodeQL/Scorecard conditional until the repository is public |
| Test bar        | 100% unit coverage (api Jest + web Vitest), E2E of every route and variant, Stryker in Phase 8 (api `break: 100`, web `break: 90`), export audit |

---

## 4. Per-Phase Detail

### Phase 0: Repository Foundation & CI

**Goal:** a buildable pnpm monorepo with the full Bymax toolchain and a CI workflow gating the
very first PR.
**Prerequisites:** none.
**Scope (in):** root `package.json` (workspaces, scripts), `pnpm-workspace.yaml`, `.nvmrc`,
`.npmrc`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc.mjs`, husky + commitlint +
lint-staged, `.gitmessage`, `.editorconfig`, `.gitignore`, `renovate.json` (grouped
`@bymax-one/**` rule), `LICENSE`, `README` stub, `CHANGELOG`, `CONTRIBUTING`, `CODE_OF_CONDUCT`,
`CLAUDE.md`/`AGENTS.md` stubs, `.github/workflows/ci.yml` (install, lint, typecheck, build,
test with `--passWithNoTests`), CodeQL + Scorecard workflows conditionally enabled (inert while
private), dependabot or Renovate app config.
**Scope (out):** any application code; any library dependency.
**Definition of Done:** `pnpm install && pnpm lint && pnpm typecheck && pnpm format:check` pass
on a clean checkout; the phase PR itself runs the new CI green; commit messages are rejected
without Conventional format.
**References:** spec §19, §6. **Size:** M.

### Phase 1: Library Consumption & Subpath Probes

**Goal:** `apps/api` consumes `@bymax-one/nest-core` from the sibling local checkout and all
three subpaths type-resolve.
**Prerequisites:** Phase 0 + the **external gate** (the library's `dist/` built at
`../nest-core`; see the External Precondition).
**Scope (in):** workspace packages `apps/api` (holder package.json), the library dependency
`file:../../../nest-core` with required peers (`@nestjs/common`, `@nestjs/core`, `reflect-metadata`, `rxjs`) and
the optional peer `prom-client`; a typed three-subpath probe (`.`, `./pagination`, `./health`)
proving resolution; removal of `--passWithNoTests` once the probe test lands.
**Scope (out):** real wiring (Phase 2).
**Definition of Done:** `pnpm typecheck` resolves all three subpaths; the probe compiles and its
unit test passes; peers resolve to a single copy.
**References:** spec §8, matrix rows 1-4 partially. **Size:** S.

### Phase 2: API Skeleton + Core Wiring

**Goal:** a booting NestJS 11 service with `BymaxCoreModule.forRootAsync` wired from validated
env, the correlation provider, the ring-buffer timing sink, and the envelope live on every
error.
**Prerequisites:** Phase 1.
**Scope (in):** `main.ts` (CORS, shutdown hooks), `config/env.schema.ts` (Zod + `validateEnv`),
`core/core.config.ts` (`buildCoreOptions`), `core/request-context.{service,middleware}.ts`
(AsyncLocalStorage `ICorrelationIdProvider` + `x-request-id` echo),
`core/ring-buffer-timing.sink.ts` (`ITimingSink`, bounded, poisonable),
`core/core.module.ts` (Symbol-token providers), `app.module.ts`, `common/zod-validation.pipe.ts`,
`timing-feed` module (`GET /timing/samples` + threshold from `BYMAX_CORE_OPTIONS`).
**Scope (out):** catalog, failures, health toggles, metrics demo (Phases 3-5).
**Definition of Done:** the API boots with zero infra; an unknown route already returns the
7-field envelope with a `correlationId`; `GET /timing/samples` shows samples with the route
template and the `slow` flag; unit tests cover every new file at 100%.
**References:** spec §9, §10, matrix rows 1, 3-7, 11-13, 18-19, 37-42 partially. **Size:** L.

### Phase 3: Catalog Domain & Pagination

**Goal:** the seeded in-memory catalog exercises the entire `./pagination` subpath plus the
`BYMAX_NOT_FOUND` and validation envelope paths.
**Prerequisites:** Phase 2.
**Scope (in):** `catalog/` module (repository with deterministic seed + artificial latency,
offset endpoint, cursor endpoint, single lookup, Zod-validated create, the seasonal domain-code
endpoint), `common/domain-errors.ts`.
**Definition of Done:** offset meta is clamped and correct; the cursor walk reaches
`nextCursor: null`; a tampered cursor returns `BYMAX_VALIDATION_FAILED`; unknown id returns
`BYMAX_NOT_FOUND`; 100% unit coverage on the new files.
**References:** spec §11, §12.3, matrix rows 14-15, 21, 24, 43-51. **Size:** M.

### Phase 4: Failure Injection & Latency Lab (API)

**Goal:** every `BYMAX_*` derivation reproducible on demand; the slow-flag and sink-poison
demonstrations complete.
**Prerequisites:** Phase 2.
**Scope (in):** `failures/` module (one trigger per catalog row incl. 418 → `BYMAX_CLIENT_ERROR`,
507 → `BYMAX_INTERNAL_ERROR`, unknown-throw collapse, exposeInternals contrast), `latency/`
module (`GET /latency?ms=&poison=`).
**Definition of Done:** all §7.3 matrix rows return their exact code and status; the prod-mode
collapse is unit-proven; a poisoned sink never breaks the request; 100% unit coverage.
**References:** spec §12.1, §12.2, matrix rows 16-17, 20-36, 39-41. **Size:** M.

### Phase 5: Health Indicators & Metrics (API)

**Goal:** the full `./health` and metrics surfaces, including the disabled-path proofs and the
optional Prometheus profile.
**Prerequisites:** Phase 2.
**Scope (in):** `health-demo/` (event-loop, flaky, hanging indicators + toggle endpoints),
`metrics-demo/` (`catalog_lookups_total` against `BYMAX_METRICS_REGISTRY`), metrics enabled in
the default env, `docker-compose.yml` (+ `docker/prometheus/prometheus.yml`, `tools` profile).
**Definition of Done:** readiness flips 200 ↔ 503 with the toggle; the hanging indicator is
reported `down` by timeout with a diagnostic; `/metrics` serves default + custom metrics with
default labels; 100% unit coverage.
**References:** spec §12.4, §12.5, §16, §17, matrix rows 8-9, 52-70 partially. **Size:** M.

### Phase 6: Dashboard: Shell + All Pages

**Goal:** the Next.js 16 dashboard, visually identical to the sibling apps, rendering all six
pages against the real API.
**Prerequisites:** Phases 3, 4, 5.
**Scope (in):** `apps/web` skeleton (Tailwind v4, shadcn `new-york`, Geist, forced dark, shell
per `design_system.html`), `lib/api-client.ts` + `lib/envelope.ts` (mirrored contract), the six
pages (Overview, Errors, Latency, Pagination, Health, Metrics) and the bespoke components
(`EnvelopeViewer`, `SampleFeed`, `CursorTrail`, `CheckList`).
**Definition of Done:** every §12 scenario is operable end to end in the browser; `pnpm --filter
web build` succeeds; the shell is indistinguishable from a sibling screenshot.
**References:** spec §13, §14. **Size:** L.

### Phase 7: Testing to the Reference Bar

**Goal:** the full verification net: 100% unit on both apps, E2E of every route and every
configuration variant.
**Prerequisites:** Phase 6.
**Scope (in):** api unit completion to 100/100/100/100; web unit (Vitest) to 100 with the
envelope constants pinned; E2E suites: every endpoint, every error code, `forRoot` sync path,
disabled-feature variants (health off → 404, metrics off → 404 + prom-client never loaded,
envelope off → raw shape, timing off → zero samples), custom `health.path`/`metrics.path`,
prod-collapse variant, missing-peer fail-fast; CI hardened (coverage thresholds enforced, no
`--passWithNoTests` anywhere).
**Definition of Done:** `pnpm test:cov` (both apps) reports 100 on all four metrics; `pnpm
test:e2e` green with every route and variant asserted; CI runs the tiers sequentially.
**References:** spec §18, matrix rows 2, 10-11, 41-42, 57, 59-62, 68. **Size:** L.

### Phase 8: Mutation, Docs, README & Export Audit

**Goal:** assertion-quality hardening and the polished public face.
**Prerequisites:** Phase 7.
**Scope (in):** Stryker per app (api `break: 100`, web `break: 90` with `lib/**` at 100),
survivor hardening, `docs/stryker/` records; `scripts/audit-library-exports.mjs` +
`.audit-ignore.json` + CI job; final `README.md` (badges, quick start, endpoints table, coverage
matrix summary, curl journeys), `CHANGELOG.md` 0.1.0; design-system acceptance (side-by-side
screenshot).
**Definition of Done:** mutation thresholds hold with survivors documented as proven
equivalents; `pnpm audit:exports` exits 0; README renders with working links; the §7 matrix is
fully ✅.
**References:** spec §7, §18, §21. **Size:** M.

---

## 5. Update Protocol

1. Task state changes happen first in the phase file (status, checkboxes, task index,
   progress counter, completion log).
2. Then update this dashboard: the phase row (Done / Total, Status) and the progress blockquote
   (phases %, tasks, active phase, blocked list).
3. If the local-build check ever fails, Phase 1 goes ⛔ until the library's `dist/` is
   rebuilt (`pnpm -C ../nest-core build`); the completion log records the packed library
   version from `../nest-core/package.json`.
4. A phase moves to ✅ only when every task is done, its Definition of Done holds, and its PR is
   merged with CI green and the Copilot review resolved.
5. Commit dashboards with `docs(plan): update phase N status` (English, Conventional, no
   attribution trailers).
6. This file is the canonical dashboard; `docs/tasks/README.md` only mirrors it.

---

## Appendix A: Environment Variable Registry

Canonical table in [`TECHNICAL_SPECIFICATION.md` §9](TECHNICAL_SPECIFICATION.md#9--configuration--environment).
API: `NODE_ENV`, `PORT`, `WEB_ORIGIN`, `ENVELOPE_EXPOSE_INTERNALS`, `TIMING_SLOW_THRESHOLD_MS`,
`TIMING_BUFFER_SIZE`, `HEALTH_PATH`, `HEALTH_INDICATOR_TIMEOUT_MS`, `METRICS_ENABLED`,
`METRICS_PATH`, `CATALOG_SEED_COUNT`, `CATALOG_ORIGIN_LATENCY_MS`. Web: `NEXT_PUBLIC_API_URL`.
Every variable is Zod-validated in `apps/api/src/config/env.schema.ts`.

## Appendix B: Quality Gates

| Gate           | Tool                                     | Threshold                                | Enforced from |
| -------------- | ----------------------------------------- | ----------------------------------------- | ------------- |
| Lint           | ESLint 9 flat                             | zero errors                               | Phase 0 CI    |
| Typecheck      | `tsc --noEmit` per package                | zero errors                               | Phase 0 CI    |
| API unit + cov | Jest                                      | 100 / 100 / 100 / 100                     | Phase 7       |
| Web unit + cov | Vitest + coverage-v8                      | 100 / 100 / 100 / 100                     | Phase 7       |
| API E2E        | Jest + supertest                          | every route + variant asserted            | Phase 7       |
| Web build      | `next build`                              | succeeds                                  | Phase 6       |
| Mutation       | Stryker                                   | api `break: 100`; web `break: 90`         | Phase 8       |
| Export audit   | `scripts/audit-library-exports.mjs`       | every export demonstrated                 | Phase 8       |
| Pre-commit     | husky + lint-staged                       | prettier + eslint on staged               | Phase 0       |
| Commit format  | commitlint                                | Conventional Commits                      | Phase 0       |
| Public-only    | CodeQL + OpenSSF Scorecard                | conditional; activate when repo is public | Phase 0       |
