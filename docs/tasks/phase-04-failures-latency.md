# Phase 4: Failure Injection & Latency Lab (API)

> **Status**: 🔄 In Progress · **Progress**: 2 / 4 tasks · **Last updated**: 2026-07-17
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-4-failure-injection--latency-lab-api)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §12.1, §12.2, §7.3, §7.4

## Context

With the wiring live (Phase 2), this phase makes every `BYMAX_*` derivation of the error code
catalog reproducible on demand (`failures` module), proves the production-safe collapse of
unknown errors and the `exposeInternals` contrast, and delivers the Latency Lab backend: the
artificial-delay endpoint that drives the `slow` flag and the sink-poison proof.

## Rules-of-phase

1. Failure triggers only ever produce error responses; they carry no side effects and are
   documented as demo-only surface.
2. The prod-collapse assertions run against a prod-mode module (`NODE_ENV=production`,
   `exposeInternals=false`) built in unit tests, never by mutating the running dev app.
3. The trigger-to-code table in the spec (§7.3) is the contract: every row gets exactly one
   trigger and one asserting test.
4. 100% unit coverage per task; tests sequential (`maxWorkers '50%'`).

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §7.3 (rows 20-36), §7.4 (rows 37-42), §12.1, §12.2
- `node_modules/@bymax-one/nest-core/README.md` envelope + timing sections

## Task index

| ID  | Task                                                          | Status | Priority | Size | Depends on |
| --- | -------------------------------------------------------------- | ------ | -------- | ---- | ---------- |
| 4.1 | Branch + failures module: standard HttpException triggers      | ✅     | P0       | M    | Phase 2    |
| 4.2 | Fallback + collapse triggers (418, 507, unknown) + prod proof  | ✅     | P0       | M    | 4.1        |
| 4.3 | Latency endpoint (slow flag + sink poison round trip)          | 📋     | P0       | S    | Phase 2    |
| 4.4 | Phase close: audit, dashboards, PR + Copilot review + merge    | 📋     | P0       | S    | 4.1-4.3    |

## Tasks

### Task 4.1: Branch + failures module: standard HttpException triggers

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 2

#### Description

The `failures` module with `POST /failures/:kind` covering every standard `HttpException`
derivation: bad-request, unauthorized, forbidden, conflict, payload-too-large,
unsupported-media-type, unprocessable, too-many-requests, internal, not-implemented,
bad-gateway, service-unavailable, gateway-timeout. Each trigger throws the canonical Nest
exception; each asserted test pins the resulting envelope code and status.

#### Acceptance criteria

- [x] Branch `feat/phase-04-failures-latency` created with `git switch -c`.
- [x] `POST /failures/:kind` with a typed kind registry (a `Record<kind, () => never>` map, no
      switch sprawl); unknown kind returns `BYMAX_NOT_FOUND` for the trigger itself.
- [x] One unit test per §7.3 row covered here, asserting `code` + `statusCode` through a real
      filter-wired test module.
- [x] 100% unit coverage.

#### Files to create / modify

- `apps/api/src/failures/failures.controller.ts`, `apps/api/src/failures/failures.service.ts`,
  `apps/api/src/failures/failure-registry.ts`, `apps/api/src/failures/failures.module.ts`
  (+ specs), `apps/api/src/app.module.ts`

#### Agent prompt

````
You are a senior NestJS engineer building an error-catalog demonstration surface.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core (TS strict, Jest maxWorkers
'50%'). The library's exception filter is live globally; the goal is to trigger every standard
BYMAX_* derivation on demand.

CURRENT PHASE: 4 (Failure Injection & Latency Lab), Task 4.1 of 4 (FIRST).

PRECONDITIONS
- Phase 2 merged (envelope live).

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7.3 rows 20-34 (the trigger-to-code contract)
- node_modules/@bymax-one/nest-core/README.md, status-to-code table

TASK
Create the failures module with one trigger per standard HttpException derivation, each pinned
by a test.

DELIVERABLES
1. `git switch -c feat/phase-04-failures-latency` (NEVER `git checkout -b`).
2. failure-registry.ts: a frozen Record mapping kind strings (bad-request, unauthorized,
   forbidden, conflict, payload-too-large, unsupported-media-type, unprocessable,
   too-many-requests, internal, not-implemented, bad-gateway, service-unavailable,
   gateway-timeout) to functions throwing the matching @nestjs/common exception with a
   deterministic message.
3. failures.service.ts trigger(kind) resolving the registry (unknown kind -> NotFoundException);
   failures.controller.ts POST /failures/:kind; module registered in AppModule.
4. Specs: for each kind, boot a testing module with the library filter wired exactly as
   production and assert the envelope's code + statusCode via supertest against the in-memory
   http server.
5. Commit: `feat(api): failure triggers for the standard error-code catalog (4.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Triggers have zero side effects. TS strict; no suppressions; functions <= 50 lines;
  @fileoverview + @layer; JSDoc; timeless English comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + `curl -s -X POST localhost:3001/failures/conflict` returns code BYMAX_CONFLICT,
  statusCode 409.

Completion Protocol:
1. In docs/tasks/phase-04-failures-latency.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 4.1 ✅ <date> <summary>` to
   the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 4.2: Fallback + collapse triggers (418, 507, unknown) + prod proof

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 4.1

#### Description

The subtle rows of the catalog: an unmapped 4xx (418 → `BYMAX_CLIENT_ERROR`), an unmapped 5xx
(507 → `BYMAX_INTERNAL_ERROR`), and the unknown-throw collapse (`throw new Error(...)` → 500,
fixed message). The prod proof boots a production-mode test module and asserts no stack, no
original message; the dev contrast asserts `exposeInternals` includes them.

#### Acceptance criteria

- [x] Triggers `teapot` (418), `variant-5xx` (507), `unknown` (plain `Error` throw) added to
      the registry.
- [x] Prod-mode test module (`exposeInternals: false`): unknown throw yields exactly
      `{ statusCode: 500, code: 'BYMAX_INTERNAL_ERROR', message: 'Internal server error' }`
      fields plus timestamp/path/correlationId; no stack anywhere in the body.
- [x] Dev-mode contrast: same throw with `exposeInternals: true` carries the original message
      in `details`.
- [x] 100% unit coverage.

#### Files to create / modify

- `apps/api/src/failures/failure-registry.ts` (+ specs)

#### Agent prompt

````
You are a senior NestJS engineer proving production-safe error collapse.

PROJECT: nest-core-example. Standard failure triggers exist (4.1) on branch
feat/phase-04-failures-latency.

CURRENT PHASE: 4, Task 4.2 of 4 (MIDDLE).

PRECONDITIONS
- Task 4.1 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7.3 rows 30, 35-36, §7.2 rows 16-17
- node_modules/@bymax-one/nest-core/README.md, unknown-error + exposeInternals sections

TASK
Add the fallback and collapse triggers and the prod/dev proof suites.

DELIVERABLES
1. Registry additions: teapot -> new HttpException('I am a teapot', 418); variant-5xx ->
   new HttpException('Insufficient storage', 507); unknown -> throw new Error('demo unknown
   failure: <deterministic marker>').
2. Two dedicated spec files: prod-collapse.spec.ts (module built with exposeInternals false,
   NODE_ENV production semantics) asserting the fixed message, the absence of the marker and of
   any stack property; dev-internals.spec.ts asserting the marker appears under details when
   exposeInternals is true.
3. Commit: `feat(api): fallback and unknown-collapse triggers with prod proof (4.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never mutate global NODE_ENV in a running app; build isolated test modules per mode. TS
  strict; no suppressions; JSDoc; timeless comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + `curl -s -X POST localhost:3001/failures/teapot` returns code BYMAX_CLIENT_ERROR,
  statusCode 418.

Completion Protocol:
1. In docs/tasks/phase-04-failures-latency.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 4.2 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 4.3: Latency endpoint (slow flag + sink poison round trip)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: Phase 2

#### Description

`GET /latency?ms=` sleeps the requested time (clamped to a safe maximum) and returns the actual
elapsed duration, driving the `slow` flag above `TIMING_SLOW_THRESHOLD_MS`. Combined with the
Phase 2 poison control it completes the timing proofs: a poisoned sink throws once and the
request still succeeds, with the E2E-grade assertion living in the unit tier via a real
interceptor-wired module.

#### Acceptance criteria

- [ ] `GET /latency?ms=` (Zod-validated, clamped to `0..5000`) responds
      `{ requestedMs, elapsedMs }`.
- [ ] Test: a request above the threshold produces a sample with `slow: true` in the ring
      buffer; below produces `slow: false`; a failing request still records its status.
- [ ] Test: after `POST /timing/poison`, the next request succeeds (2xx) and the sink resumes
      recording afterwards.
- [ ] 100% unit coverage.

#### Files to create / modify

- `apps/api/src/latency/latency.controller.ts`, `apps/api/src/latency/latency.module.ts`
  (+ specs), `apps/api/src/app.module.ts`

#### Agent prompt

````
You are a senior NestJS engineer completing a request-timing demonstration.

PROJECT: nest-core-example. Timing interceptor + RingBufferTimingSink + poison control are live
(Phase 2). Branch feat/phase-04-failures-latency.

CURRENT PHASE: 4, Task 4.3 of 4 (MIDDLE).

PRECONDITIONS
- Phase 2 merged; tasks 4.1-4.2 on the branch (shared module registrations).

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §12.2 (Latency Lab), §7.4 rows 37-42
- node_modules/@bymax-one/nest-core/README.md, timing section

TASK
Add the artificial-delay endpoint and the slow-flag + poison proof suites.

DELIVERABLES
1. latency.controller.ts GET /latency with a zod-validated ms query (default 0, clamp 0..5000),
   awaiting a setTimeout and returning { requestedMs, elapsedMs }; module; AppModule
   registration.
2. Specs against a real module with the interceptor + sink wired as production: slow true/false
   around the threshold; error status recorded; poison single-shot never failing the request.
3. Commit: `feat(api): latency lab endpoint with slow-flag and sink-poison proofs (4.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Use fake timers where determinism needs them; never assert exact wall-clock durations, only
  ordering and flags. TS strict; no suppressions; JSDoc; timeless comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + `curl -s 'localhost:3001/latency?ms=600'` then `curl -s localhost:3001/timing/samples`
  shows a sample with slow true (threshold 500 in dev).

Completion Protocol:
1. In docs/tasks/phase-04-failures-latency.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 4.3 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 4.4: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 4.1, 4.2, 4.3

#### Description

Standard phase close: re-verify 4.1-4.3, synchronize dashboards, open the PR, obtain and
resolve the GitHub Copilot review, merge with CI green.

#### Acceptance criteria

- [ ] All verification commands of 4.1-4.3 re-run green.
- [ ] Dashboards consistent (4/4); PR opened; Copilot review requested and fully addressed;
      squash-merged with branch deletion; `main` CI green.

#### Files to create / modify

- `docs/tasks/phase-04-failures-latency.md`, `docs/DEVELOPMENT_PLAN.md`,
  `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 4 tasks 4.1-4.3 are implemented on branch
feat/phase-04-failures-latency.

CURRENT PHASE: 4, Task 4.4 of 4 (LAST: phase close).

PRECONDITIONS
- Tasks 4.1-4.3 committed; local gates green.

REQUIRED READING (only these)
- docs/tasks/phase-04-failures-latency.md (all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Audit the phase, update dashboards, open the PR, obtain and resolve the GitHub Copilot code
review, merge with CI green.

DELIVERABLES
1. Re-run every Verification command from 4.1-4.3; fix anything red first.
2. Update this file (header, index, log), the plan dashboard, the tasks README.
3. `gh pr create --title "feat: full error-code catalog triggers and latency lab" --body
   <professional summary with the code-to-trigger table>`; request the GitHub Copilot code
   review (`gh pr edit --add-reviewer copilot-pull-request-reviewer[bot]` or the UI); address
   EVERY finding, resolving threads with the fix SHA.
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
1. In docs/tasks/phase-04-failures-latency.md set this task's Status to ✅, tick checkboxes,
   set header Status ✅ and Progress 4/4, append `- 4.4 ✅ <date> <summary>`.
2. Flip the Phase 4 row to ✅ in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md; set the
   next runnable phase as active per the dependency map.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->

- 4.1 ✅ 2026-07-17 failures module added: frozen `FAILURE_REGISTRY` (13 standard
  `HttpException` derivations, bad-request through gateway-timeout), `FailuresService.trigger`
  collapsing an unregistered kind to `NotFoundException`, `POST /failures/:kind` wired into
  AppModule; integration suite boots a real testing module with `BymaxCoreModule.forRoot()` and
  asserts every row's exact `(code, statusCode)` via supertest; 100% unit coverage.
- 4.2 ✅ 2026-07-17 Registry extended with `teapot` (418 -> `BYMAX_CLIENT_ERROR`), `variant-5xx`
  (507 -> `BYMAX_INTERNAL_ERROR`), and `unknown` (plain `Error` throw, deterministic marker); two
  dedicated suites prove the collapse: prod-collapse.spec.ts (`exposeInternals: false`) asserts
  the fixed 500 envelope with no `details` key and no marker or stack anywhere in the body;
  dev-internals.spec.ts (`exposeInternals: true`) asserts the same fixed top-level `message`
  with the original marker and a stack surfaced under `details`; 100% unit coverage.
