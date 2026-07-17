# Phase 2: API Skeleton + Core Wiring

> **Status**: 🔄 In Progress · **Progress**: 2 / 5 tasks · **Last updated**: 2026-07-17
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-2-api-skeleton--core-wiring)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §9, §10

## Context

`apps/api` exists as a holder with the library installed (Phase 1). This phase turns it into a
booting NestJS 11 service with `BymaxCoreModule.forRootAsync` wired from Zod-validated env, the
AsyncLocalStorage correlation provider, the ring-buffer timing sink, and the `timing-feed`
endpoint. When this phase merges, every error already leaves the API as the 7-field envelope
with a correlation id, and timing samples are observable. The service needs zero external
infrastructure.

## Rules-of-phase

1. No raw `process.env` outside `config/env.schema.ts`.
2. Every provider constructor parameter and factory `inject` entry uses explicit `@Inject` with
   the library's Symbol tokens.
3. `isGlobal` is passed at the `forRootAsync` call site (synchronous builder extra), never
   returned from `useFactory`; document this inline.
4. Each task lands with its unit tests at 100% on the new files (`maxWorkers: '50%'`).
5. The wiring files are the copy-paste reference for real consumers: JSDoc-rich, generic names.

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §9 (Configuration & Environment), §10 (Backend Design), §4.5 (option defaults)
- [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) §3, §4 Phase 2

## Task index

| ID  | Task                                                          | Status | Priority | Size | Depends on |
| --- | -------------------------------------------------------------- | ------ | -------- | ---- | ---------- |
| 2.1 | Branch + Nest app skeleton + Zod env schema                    | ✅     | P0       | M    | Phase 1    |
| 2.2 | Correlation: request context (ALS) + middleware + header echo  | ✅     | P0       | M    | 2.1        |
| 2.3 | Timing sink (ring buffer, poisonable) + core.config factory    | 📋     | P0       | M    | 2.1        |
| 2.4 | Module wiring (forRootAsync + token providers) + timing-feed   | 📋     | P0       | M    | 2.2, 2.3   |
| 2.5 | Phase close: audit, dashboards, PR + Copilot review + merge    | 📋     | P0       | S    | 2.1-2.4    |

## Tasks

### Task 2.1: Branch + Nest app skeleton + Zod env schema

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 1

#### Description

The NestJS 11 application shell: `main.ts` (CORS to `WEB_ORIGIN`, shutdown hooks), an
`AppModule` that boots, `nest-cli.json`, tsconfigs, and the Zod env schema with `validateEnv()`
wired through `@nestjs/config` so a bad environment fails at startup with a readable report.

#### Acceptance criteria

- [x] Branch `feat/phase-02-api-skeleton-wiring` created with `git switch -c`.
- [x] `src/config/env.schema.ts`: Zod schema for every Appendix A variable with defaults;
      `validateEnv()`; exported `Env` type; unit-tested (valid, invalid, defaults).
- [x] `main.ts`: `createApp()` seam (testable) + `bootstrap()`; CORS restricted to
      `WEB_ORIGIN`; `enableShutdownHooks`.
- [x] `pnpm --filter @nest-core-example/api dev` boots and serves a minimal `GET /` info route.
- [x] 100% unit coverage on the new files; `it()` scenario comments.

#### Files to create / modify

- `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/app.controller.ts`,
  `apps/api/src/config/env.schema.ts` (+ spec), `apps/api/nest-cli.json`,
  `apps/api/tsconfig.build.json`, `apps/api/package.json` (nest deps + scripts)

#### Agent prompt

````
You are a senior NestJS engineer building the application shell of a reference app.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core. apps/api holds the library
dependency and a probe (Phase 1). pnpm monorepo, Node 24, TS strict, Jest maxWorkers '50%'.

CURRENT PHASE: 2 (API Skeleton + Core Wiring), Task 2.1 of 5 (FIRST).

PRECONDITIONS
- Phase 1 merged; `pnpm install` green; the library resolves from its packed `file:` dependency.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §9.1 (env table) and §10 (backend design)
- docs/DEVELOPMENT_PLAN.md Appendix A

TASK
Create the bootable NestJS skeleton and the Zod env schema with fail-fast validation.

DELIVERABLES
1. `git switch -c feat/phase-02-api-skeleton-wiring` (NEVER `git checkout -b`).
2. src/config/env.schema.ts: zod v4 schema covering NODE_ENV, PORT, WEB_ORIGIN,
   ENVELOPE_EXPOSE_INTERNALS, TIMING_SLOW_THRESHOLD_MS, TIMING_BUFFER_SIZE, HEALTH_PATH,
   HEALTH_INDICATOR_TIMEOUT_MS, METRICS_ENABLED, METRICS_PATH, CATALOG_SEED_COUNT,
   CATALOG_ORIGIN_LATENCY_MS (defaults per the spec table); validateEnv() aggregating all
   issues into one readable error; export type Env. Full unit spec.
3. main.ts with a createApp() factory (returns the configured INestApplication) and a
   bootstrap() entry; CORS restricted to WEB_ORIGIN; enableShutdownHooks. app.module.ts wires
   ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }). app.controller.ts serves
   GET / returning { name, docs: '/docs listing in README' } (minimal, typed).
4. nest-cli.json, tsconfig.build.json, package.json scripts: dev, build, start, test, test:cov.
5. .env.example covering every variable with the dev defaults, commented.
6. Commit: `feat(api): nest 11 skeleton with zod-validated environment (2.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No process.env outside env.schema.ts. TS strict, no any, no suppressions; functions <= 50
  lines; files <= 800; @fileoverview + @layer header per file; JSDoc on exports; English-only
  timeless comments; no .gitkeep; no em dashes. Run tests sequentially (maxWorkers '50%').

Verification:
- `pnpm --filter @nest-core-example/api test:cov` exits 0 at 100% on the four metrics.
- `pnpm --filter @nest-core-example/api build` exits 0; `PORT=3999 node dist/main.js` boots and
  `curl -s localhost:3999/` returns JSON (then stop it).

Completion Protocol:
1. In docs/tasks/phase-02-api-skeleton-wiring.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 2.1 ✅ <date> <summary>` to
   the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md (Progress Dashboard) and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 2.2: Correlation: request context (ALS) + middleware + header echo

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 2.1

#### Description

The example's `ICorrelationIdProvider`: an AsyncLocalStorage store populated by a middleware
with `crypto.randomUUID()` per request, a service exposing `getCorrelationId()`, and an
`x-request-id` response header echo so the dashboard can display the pairing.

#### Acceptance criteria

- [x] `core/request-context.service.ts` implements the library's `ICorrelationIdProvider`
      contract over `AsyncLocalStorage` (returns `undefined` outside a request).
- [x] `core/request-context.middleware.ts` seeds the store and sets `x-request-id`; applied to
      all routes in `AppModule`.
- [x] JSDoc on the service documents the production pairing (a structured-logging context
      service can satisfy the same token with one `useExisting`).
- [x] 100% unit coverage (inside/outside context, header echo, uuid format).

#### Files to create / modify

- `apps/api/src/core/request-context.service.ts` (+ spec),
  `apps/api/src/core/request-context.middleware.ts` (+ spec), `apps/api/src/app.module.ts`

#### Agent prompt

````
You are a senior Node.js engineer implementing request-scoped context with AsyncLocalStorage.

PROJECT: nest-core-example. The Nest skeleton boots (task 2.1) on branch
feat/phase-02-api-skeleton-wiring. The library contract to satisfy is
ICorrelationIdProvider { getCorrelationId(): string | undefined } from '@bymax-one/nest-core'.

CURRENT PHASE: 2, Task 2.2 of 5 (MIDDLE).

PRECONDITIONS
- Task 2.1 done; app boots; env schema exists.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §10.3 (Request context)
- node_modules/@bymax-one/nest-core/README.md, correlation section (verify the exact interface)

TASK
Implement RequestContextService (ALS-based ICorrelationIdProvider), the seeding middleware with
the x-request-id echo, and wire the middleware for all routes.

DELIVERABLES
1. core/request-context.service.ts: an @Injectable holding a private
   AsyncLocalStorage<{ correlationId: string }>; run(id, fn) + getCorrelationId(); implements
   ICorrelationIdProvider; ~30 lines, JSDoc-rich, notes the production pairing generically.
2. core/request-context.middleware.ts: NestMiddleware; id = crypto.randomUUID() (node:crypto);
   res.setHeader('x-request-id', id); wraps next() in service.run(id, ...).
3. AppModule configure() applies the middleware to '*'.
4. Full unit specs: id available inside the run scope, undefined outside, header set, unique
   per call.
5. Commit: `feat(api): asynclocalstorage correlation provider with header echo (2.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- node:crypto only (no uuid package). TS strict; no suppressions; @fileoverview + @layer;
  JSDoc on exports; timeless English comments; no em dashes; tests sequential.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` exits 0 at 100%.
- `pnpm --filter @nest-core-example/api dev` + `curl -si localhost:3001/ | grep -i x-request-id`
  shows a uuid (then stop it).

Completion Protocol:
1. In docs/tasks/phase-02-api-skeleton-wiring.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 2.2 ✅ <date> <summary>` to
   the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 2.3: Timing sink (ring buffer, poisonable) + core.config factory

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 2.1

#### Description

The demo `ITimingSink`: a bounded in-memory ring buffer of `RequestTimingSample`s with a
one-shot poison mode (throws once, proving the interceptor's never-throw guarantee), plus the
`buildCoreOptions(config)` factory, the project's headline copy-paste artifact.

#### Acceptance criteria

- [ ] `core/ring-buffer-timing.sink.ts`: `record()` appends; capacity from
      `TIMING_BUFFER_SIZE` (oldest evicted); `snapshot()` returns a copy; `armPoison()` makes
      the next `record()` throw exactly once (documented as the never-throw proof).
- [ ] `core/core.config.ts`: `buildCoreOptions(config)` returning envelope/timing/health/metrics
      blocks exactly per spec §9.2.
- [ ] 100% unit coverage (eviction, snapshot immutability, poison single-shot, option mapping
      for every env combination).

#### Files to create / modify

- `apps/api/src/core/ring-buffer-timing.sink.ts` (+ spec),
  `apps/api/src/core/core.config.ts` (+ spec)

#### Agent prompt

````
You are a senior TypeScript engineer writing the reference ITimingSink and options factory.

PROJECT: nest-core-example. Skeleton + env schema exist (2.1) on branch
feat/phase-02-api-skeleton-wiring. Library contracts (from '@bymax-one/nest-core'):
ITimingSink { record(sample: RequestTimingSample): void } and BymaxCoreModuleOptions.

CURRENT PHASE: 2, Task 2.3 of 5 (MIDDLE).

PRECONDITIONS
- Task 2.1 done (Env type available).

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §9.2 (the canonical wiring) and §16 (Observability)
- node_modules/@bymax-one/nest-core/README.md, timing + options sections (verify exact shapes)

TASK
Implement RingBufferTimingSink (bounded, poisonable) and buildCoreOptions(config).

DELIVERABLES
1. core/ring-buffer-timing.sink.ts per the acceptance criteria; JSDoc states the library
   guarantees a throwing sink never breaks a request and the poison mode exists to prove it.
2. core/core.config.ts: buildCoreOptions(config: ConfigService<Env, true>):
   BymaxCoreModuleOptions mapping the env exactly as spec §9.2 (envelope.exposeInternals,
   timing.slowRequestThresholdMs, health.path + indicatorTimeoutMs, metrics.enabled + path +
   defaultLabels { app: 'nest-core-example' }).
3. Full unit specs, every it() with a scenario comment.
4. Commit: `feat(api): ring-buffer timing sink and core options factory (2.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- TS strict; no suppressions; functions <= 50 lines; @fileoverview + @layer; JSDoc on exports;
  timeless English comments; no em dashes; tests sequential (maxWorkers '50%').

Verification:
- `pnpm --filter @nest-core-example/api test:cov` exits 0 at 100% on the four metrics.

Completion Protocol:
1. In docs/tasks/phase-02-api-skeleton-wiring.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 2.3 ✅ <date> <summary>` to
   the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 2.4: Module wiring (forRootAsync + token providers) + timing-feed

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 2.2, 2.3

#### Description

The moment the library goes live: `BymaxCoreModule.forRootAsync` in `AppModule`, the Symbol
tokens bound to the example's providers, the Zod validation pipe, and the `timing-feed` module
exposing recent samples with the resolved threshold read from `BYMAX_CORE_OPTIONS`.

#### Acceptance criteria

- [ ] `core/core.module.ts` provides `BYMAX_CORRELATION_PROVIDER` (useExisting
      RequestContextService) and `BYMAX_TIMING_SINK` (useExisting RingBufferTimingSink);
      exports both services.
- [ ] `app.module.ts`: `BymaxCoreModule.forRootAsync({ isGlobal: true, imports, inject,
      useFactory: buildCoreOptions })` with the inline note that `isGlobal` is synchronous.
- [ ] `common/zod-validation.pipe.ts` parses Zod DTOs (rejections carry structured issues).
- [ ] `timing-feed` module: `GET /timing/samples` returns `{ thresholdMs, samples }` (threshold
      via `@Inject(BYMAX_CORE_OPTIONS)`); `POST /timing/poison` arms the sink poison.
- [ ] Boot proof: an unknown route returns the 7-field envelope with `correlationId`; samples
      accumulate with route templates.
- [ ] 100% unit coverage on new files.

#### Files to create / modify

- `apps/api/src/core/core.module.ts`, `apps/api/src/app.module.ts`,
  `apps/api/src/common/zod-validation.pipe.ts` (+ spec),
  `apps/api/src/timing-feed/timing-feed.controller.ts` (+ module + spec)

#### Agent prompt

````
You are a senior NestJS engineer wiring a foundation library into a running service.

PROJECT: nest-core-example. Correlation provider (2.2) and sink + options factory (2.3) exist on
branch feat/phase-02-api-skeleton-wiring. Library: @bymax-one/nest-core (module
BymaxCoreModule.forRootAsync; Symbol tokens BYMAX_CORE_OPTIONS, BYMAX_CORRELATION_PROVIDER,
BYMAX_TIMING_SINK).

CURRENT PHASE: 2, Task 2.4 of 5 (MIDDLE).

PRECONDITIONS
- Tasks 2.2 and 2.3 done; unit suites green.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §9.2 (wiring), §11.1 (timing-feed rows)
- node_modules/@bymax-one/nest-core/README.md, module registration section

TASK
Bind the token providers, register BymaxCoreModule.forRootAsync, add the Zod pipe, and expose
the timing feed.

DELIVERABLES
1. core/core.module.ts exactly as spec §9.2 (health indicators arrive in Phase 5; bind only
   correlation + sink now).
2. app.module.ts registration with isGlobal: true at the call site (inline comment: the builder
   decides global synchronously; a value returned from useFactory has no effect).
3. common/zod-validation.pipe.ts (+ spec): parse(schema) with structured issue details on
   failure (the library maps the shape to BYMAX_VALIDATION_FAILED; do not format an envelope
   yourself).
4. timing-feed/: controller GET /timing/samples ({ thresholdMs, samples: snapshot() }) and
   POST /timing/poison; module; full specs with mocked sink/options via the Symbol tokens.
5. Commit: `feat(api): wire BymaxCoreModule with correlation, sink and timing feed (2.4)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Explicit @Inject with Symbol tokens on every constructor parameter and factory inject entry.
  TS strict; no suppressions; @fileoverview + @layer; JSDoc; timeless English comments; no em
  dashes; tests sequential.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot locally: `curl -s localhost:3001/nope | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);['statusCode','code','message','timestamp','path'].forEach(k=>{if(!(k in j))throw new Error('missing '+k)});console.log('envelope OK')})"`.
- `curl -s localhost:3001/timing/samples` returns thresholdMs + at least one sample.

Completion Protocol:
1. In docs/tasks/phase-02-api-skeleton-wiring.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 2.4 ✅ <date> <summary>` to
   the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 2.5: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 2.1, 2.2, 2.3, 2.4

#### Description

Standard phase close: re-verify 2.1-2.4 (including the envelope boot proof), synchronize
dashboards, open the PR, obtain and resolve the GitHub Copilot review, merge with CI green.

#### Acceptance criteria

- [ ] All verification commands of 2.1-2.4 re-run green; the envelope + correlation boot proof
      captured in the PR body.
- [ ] Dashboards consistent (5/5); PR opened; Copilot review requested and fully addressed;
      squash-merged with branch deletion; `main` CI green.

#### Files to create / modify

- `docs/tasks/phase-02-api-skeleton-wiring.md`, `docs/DEVELOPMENT_PLAN.md`,
  `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 2 tasks 2.1-2.4 are implemented on branch
feat/phase-02-api-skeleton-wiring.

CURRENT PHASE: 2, Task 2.5 of 5 (LAST: phase close).

PRECONDITIONS
- Tasks 2.1-2.4 committed; local gates green.

REQUIRED READING (only these)
- docs/tasks/phase-02-api-skeleton-wiring.md (all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Audit the phase, update dashboards, open the PR, obtain and resolve the GitHub Copilot code
review, merge with CI green.

DELIVERABLES
1. Re-run every Verification command from 2.1-2.4; fix anything red first.
2. Update this file (header, index, log), the plan dashboard, the tasks README.
3. `gh pr create --title "feat: api skeleton with BymaxCoreModule wiring" --body <summary
   including the envelope boot proof output>`; request the GitHub Copilot code review
   (`gh pr edit --add-reviewer copilot-pull-request-reviewer[bot]` or the UI); address EVERY
   finding, resolving threads with the fix SHA.
4. `gh pr merge --squash --delete-branch` only with CI green and no unresolved threads; then
   `git switch main && git pull`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never merge with a failing check; never bypass hooks or checks.

Verification:
- `gh pr view --json state` shows MERGED; latest main run green; the phase branch is gone from
  origin and local.

Completion Protocol:
1. In docs/tasks/phase-02-api-skeleton-wiring.md set this task's Status to ✅, tick checkboxes,
   set header Status ✅ and Progress 5/5, append `- 2.5 ✅ <date> <summary>`.
2. Flip the Phase 2 row to ✅ in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md; set the
   next phase (3, 4 or 5 per the dependency map) as active.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->

- 2.1 ✅ 2026-07-17 Nest 11 skeleton (createApp/bootstrap, restricted CORS, shutdown hooks),
  Zod-validated env schema with fail-fast validateEnv, root info controller; 100% unit coverage.
- 2.2 ✅ 2026-07-17 AsyncLocalStorage RequestContextService (ICorrelationIdProvider) + seeding
  middleware echoing a generated x-request-id, applied to all routes; 100% unit coverage.
