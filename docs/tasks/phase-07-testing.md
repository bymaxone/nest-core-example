# Phase 7: Testing to the Reference Bar

> **Status**: 📋 ToDo · **Progress**: 0 / 5 tasks · **Last updated**: 2026-07-06
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-7-testing-to-the-reference-bar)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §18, §7

## Context

Both apps are feature-complete (Phases 2-6), each phase having shipped its own tests. This
phase consolidates to the reference bar: 100% unit coverage on all four metrics in both apps,
plus the E2E net that proves every route and, crucially, every **configuration variant** of the
library (sync `forRoot`, disabled features registering nothing, custom paths, prod collapse,
the never-loaded `prom-client` proof, the missing-peer fail-fast). CI is hardened to enforce
all of it.

## Rules-of-phase

1. No shortcuts to 100: no istanbul-ignore, no suppressions, no threshold lowering, no
   exclusions hiding a real gap; provably dead branches are removed from source instead.
2. Variant E2E suites build isolated test modules per configuration; they never mutate the
   running dev configuration.
3. Suites run sequentially (`maxWorkers: '50%'`; one package at a time in CI steps).
4. Every `it()` carries a scenario comment.

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §18 (Testing Strategy), §7 rows 2, 10-11, 41-42, 57, 59-62, 68
- [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) Appendix B (Quality Gates)

## Task index

| ID  | Task                                                            | Status | Priority | Size | Depends on |
| --- | ----------------------------------------------------------------- | ------ | -------- | ---- | ---------- |
| 7.1 | Branch + api unit completion to 100/100/100/100                   | 📋     | P0       | L    | Phase 6    |
| 7.2 | Web unit completion to 100 (+ pinned envelope constants)          | 📋     | P0       | M    | Phase 6    |
| 7.3 | E2E: every route through the real HTTP pipeline                   | 📋     | P0       | M    | 7.1        |
| 7.4 | E2E: configuration variants (forRoot, disabled, paths, prod, peer) | 📋     | P0       | L    | 7.1        |
| 7.5 | Phase close: CI hardening + audit + PR + Copilot review + merge   | 📋     | P0       | S    | 7.1-7.4    |

## Tasks

### Task 7.1: Branch + api unit completion to 100/100/100/100

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: L
- **Depends on**: Phase 6

#### Description

Close every unit gap in `apps/api` and enforce `coverageThreshold` 100/100/100/100 in the Jest
config so it can never regress. DI-heavy classes are constructed with mocked library providers
through their Symbol tokens.

#### Acceptance criteria

- [ ] Branch `feat/phase-07-testing` created with `git switch -c`.
- [ ] `apps/api/jest.config.cjs`: `collectCoverageFrom: src/**` minus `main.ts` bootstrap entry
      (covered structurally via the `createApp` seam spec) and declaration files;
      `coverageThreshold` global 100/100/100/100.
- [ ] `pnpm --filter @nest-core-example/api test:cov` reports 100 on all four metrics with zero
      skipped tests and zero ignore comments.
- [ ] Dead defensive branches found on the way are removed from source (each removal noted in
      the PR body).

#### Files to create / modify

- `apps/api/jest.config.cjs`, missing `*.spec.ts` files across `apps/api/src/`

#### Agent prompt

````
You are a senior test engineer driving a NestJS app to genuine 100% coverage.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core (Jest, ts-jest, maxWorkers
'50%'). All features exist; each phase shipped tests, but the global 100 threshold is not yet
enforced.

CURRENT PHASE: 7 (Testing), Task 7.1 of 5 (FIRST).

PRECONDITIONS
- Phase 6 merged; `pnpm --filter @nest-core-example/api test` green.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §18 (testing strategy)
- The current coverage report: `pnpm --filter @nest-core-example/api test:cov` output

TASK
Close every coverage gap and enforce the 100 threshold in config.

DELIVERABLES
1. `git switch -c feat/phase-07-testing` (NEVER `git checkout -b`).
2. Run test:cov, list every uncovered line/branch, and write the missing specs: construct
   DI-heavy classes directly with mocks injected via the library's Symbol tokens
   (BYMAX_CORE_OPTIONS, BYMAX_TIMING_SINK, BYMAX_HEALTH_INDICATORS, BYMAX_METRICS_REGISTRY,
   BYMAX_CORRELATION_PROVIDER); cover env-schema edge cases, middleware error paths, registry
   corner cases.
3. Enforce coverageThreshold 100/100/100/100 in jest.config.cjs; exclude only main.ts's
   bootstrap() entry line (createApp stays covered) and *.d.ts.
4. Remove provably dead branches from source rather than ignoring them; list removals in the
   PR body later.
5. Commit: `test(api): complete unit coverage to 100 on all four metrics (7.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No istanbul-ignore, no @ts-ignore/eslint-disable, no threshold games, no .skip/.todo.
  Scenario comment on every it(). Sequential execution only.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` exits 0 reporting 100/100/100/100.
- `grep -rn "istanbul ignore\|\.skip(\|\.todo(" apps/api/src apps/api/test` prints nothing.

Completion Protocol:
1. In docs/tasks/phase-07-testing.md set this task's Status to ✅ (block + task index), tick
   its checkboxes, bump the header Progress, append `- 7.1 ✅ <date> <summary>` to the
   Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 7.2: Web unit completion to 100 (+ pinned envelope constants)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 6

#### Description

Complete `apps/web` unit coverage to 100 on all four metrics with `@vitest/coverage-v8`
thresholds enforced; vendored shadcn primitives (`components/ui/**`) and route shells are the
only exclusions, each justified in config comments.

#### Acceptance criteria

- [ ] `vitest.config.ts`: coverage thresholds 100/100/100/100; documented exclusions limited to
      `components/ui/**` and `app/**` route shells.
- [ ] `lib/**`, `hooks/**` (if any), and all bespoke components fully covered; boundaries
      (fetch, timers, matchMedia) mocked.
- [ ] The envelope-constants pin spec (from 6.2) extended: field list, code list, and the
      `isErrorEnvelope` guard's reject paths.
- [ ] `pnpm --filter @nest-core-example/web test:cov` reports 100 with zero skips/ignores.

#### Files to create / modify

- `apps/web/vitest.config.ts`, missing `*.test.tsx?` files under `apps/web/`

#### Agent prompt

````
You are a senior frontend test engineer completing dashboard coverage.

PROJECT: nest-core-example. apps/web (Next 16, Vitest + Testing Library, maxWorkers '50%') has
per-phase tests; the 100 threshold is not yet enforced.

CURRENT PHASE: 7, Task 7.2 of 5 (MIDDLE).

PRECONDITIONS
- Phase 6 merged; web unit suite green. Branch feat/phase-07-testing.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §18 (web tier)
- Current coverage: `pnpm --filter @nest-core-example/web test:cov` output

TASK
Close every web coverage gap and enforce the 100 threshold.

DELIVERABLES
1. vitest.config.ts with @vitest/coverage-v8 thresholds 100/100/100/100; exclusions ONLY
   components/ui/** (vendored) and app/**/page.tsx route shells, each with a one-line justifying
   comment.
2. Missing specs for lib/** (api-client variants, parseMetrics, catalog/failures/timing/health
   wrappers), and every bespoke component's rendering branches (EnvelopeViewer, SampleFeed,
   CursorTrail, CheckList, toggles, sparkline edge cases), with fetch/timers mocked.
3. Extend the envelope pin spec per the acceptance criteria.
4. Commit: `test(web): complete unit coverage to 100 with pinned envelope contract (7.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No skips, no ignores, no threshold games; scenario comment on every it(); sequential
  execution.

Verification:
- `pnpm --filter @nest-core-example/web test:cov` exits 0 reporting 100/100/100/100.

Completion Protocol:
1. In docs/tasks/phase-07-testing.md set this task's Status to ✅ (block + task index), tick
   its checkboxes, bump the header Progress, append `- 7.2 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 7.3: E2E: every route through the real HTTP pipeline

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 7.1

#### Description

The E2E net over the production-wired app (`createApp` seam): every endpoint of the catalogue
(§11.1) asserted at least once through supertest, including the envelope shape on every error
path and the correlation header pairing.

#### Acceptance criteria

- [ ] `apps/api/test/` E2E specs (own jest e2e config, sequential): root info, catalog
      (offset clamps, cursor walk to null, corrupt cursor, 404, create + validation reject,
      seasonal custom code), failures (spot: one per family + teapot + variant-5xx + unknown),
      latency + timing feed + poison, health live/ready + toggles + timeout, metrics scrape +
      custom counter growth.
- [ ] A pinned envelope snapshot: field set exact, `x-request-id` header equals
      `correlationId`.
- [ ] `pnpm --filter @nest-core-example/api test:e2e` green.

#### Files to create / modify

- `apps/api/test/*.e2e-spec.ts`, `apps/api/jest.e2e.config.cjs`, `apps/api/package.json`
  (test:e2e script)

#### Agent prompt

````
You are a senior E2E engineer proving a full HTTP surface.

PROJECT: nest-core-example. All API features exist; unit coverage is 100 (7.1). The app builds
via a createApp() seam identical to production. Branch feat/phase-07-testing.

CURRENT PHASE: 7, Task 7.3 of 5 (MIDDLE).

PRECONDITIONS
- Task 7.1 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §11.1 (the endpoint catalogue: the checklist)

TASK
Write the per-feature E2E suites covering every route via supertest against the real app.

DELIVERABLES
1. jest.e2e.config.cjs (testRegex e2e-spec, maxWorkers '50%', no coverage) + test:e2e script.
2. test/helpers/create-testing-app.ts booting createApp() with the dev env defaults (in-memory
   everything; no infra needed).
3. Spec files per feature covering EVERY §11.1 row, asserting bodies, statuses, envelope shape
   on errors, and the x-request-id/correlationId pairing snapshot.
4. Commit: `test(api): e2e coverage of every route with the pinned envelope (7.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Specs independent (fresh app per file); no test order coupling; scenario comments; sequential
  execution; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:e2e` exits 0; a route-inventory grep in the PR
  body maps each §11.1 row to its spec file.

Completion Protocol:
1. In docs/tasks/phase-07-testing.md set this task's Status to ✅ (block + task index), tick
   its checkboxes, bump the header Progress, append `- 7.3 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 7.4: E2E: configuration variants (forRoot, disabled, paths, prod, peer)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: L
- **Depends on**: 7.1

#### Description

The suites that prove the library's configuration semantics from the consumer side, each
booting an isolated test module: sync `forRoot`; every feature disabled (health 404, metrics
404 + `prom-client` never loaded, envelope off → raw shape, timing off → zero samples); custom
`health.path` and `metrics.path`; the prod collapse; and the missing-peer fail-fast.

#### Acceptance criteria

- [ ] `forRoot` sync variant: same envelope/health behavior as the async path (matrix row 2).
- [ ] Disabled variants: `health.enabled: false` → `/health/ready` 404; `metrics.enabled:
      false` → `/metrics` 404 AND no prom-client entry in `require.cache` / the ESM module
      registry (matrix rows 60-61); envelope disabled → default Nest error shape; timing
      disabled → sink receives nothing (matrix row 11).
- [ ] Custom paths variant: `/status/ready` and `/telemetry` serve (matrix rows 59, 68).
- [ ] Missing-peer variant: enabling metrics with a stubbed failing resolver produces the
      descriptive boot error naming `prom-client` (matrix row 62; isolated module registry).
- [ ] All suites green under `test:e2e`.

#### Files to create / modify

- `apps/api/test/variants/*.e2e-spec.ts`

#### Agent prompt

````
You are a senior integration engineer proving a library's configuration matrix from outside.

PROJECT: nest-core-example. The route E2E net exists (7.3). The library under test:
@bymax-one/nest-core (BymaxCoreModule.forRoot/forRootAsync; features envelope/timing/health/
metrics all opt-in; prom-client optional peer loaded lazily). Branch feat/phase-07-testing.

CURRENT PHASE: 7, Task 7.4 of 5 (MIDDLE).

PRECONDITIONS
- Tasks 7.1 and 7.3 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7 rows 2, 10-11, 59-62, 68 and §18 (variant list)
- node_modules/@bymax-one/nest-core/README.md, configuration section

TASK
Write the variant E2E suites: sync path, disabled features, custom paths, prod collapse,
missing peer.

DELIVERABLES
1. test/variants/for-root-sync.e2e-spec.ts: a module using forRoot (sync) with the standard
   options; assert envelope + health parity with the async app.
2. test/variants/disabled-features.e2e-spec.ts: four isolated modules; assert 404s, the raw
   error shape, the untouched sink, and that prom-client is NOT loaded (inspect the module
   cache in a child-process jest environment or via jest.isolateModules; document the chosen
   mechanism inline).
3. test/variants/custom-paths.e2e-spec.ts: health.path 'status' + metrics.path 'telemetry'.
4. test/variants/prod-collapse.e2e-spec.ts: exposeInternals false; unknown throw yields the
   fixed message, no marker, no stack.
5. test/variants/missing-peer.e2e-spec.ts: with metrics enabled and the prom-client resolution
   forced to fail (jest.mock the specifier inside isolateModules), boot rejects with the
   descriptive error naming prom-client and the install command.
6. Commit: `test(api): configuration-variant e2e proofs (7.4)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Each variant is a fresh isolated module; never mutate shared state; if a variant behavior
  differs from the documented contract, the test follows the SHIPPED behavior and the PR body
  flags the doc drift. Scenario comments; sequential; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:e2e` exits 0 including test/variants/**.

Completion Protocol:
1. In docs/tasks/phase-07-testing.md set this task's Status to ✅ (block + task index), tick
   its checkboxes, bump the header Progress, append `- 7.4 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 7.5: Phase close: CI hardening + audit + PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 7.1, 7.2, 7.3, 7.4

#### Description

Harden CI to the final shape (coverage-enforced unit steps per app, then E2E, sequential;
`--if-present` tolerances gone) and close the phase with the standard PR + Copilot flow.

#### Acceptance criteria

- [ ] `ci.yml` final: lint → typecheck → build (both apps) → api test:cov → web test:cov →
      api test:e2e, sequential steps, no tolerances.
- [ ] All verification commands of 7.1-7.4 re-run green; dashboards consistent (5/5).
- [ ] PR opened; Copilot review requested and fully addressed; squash-merged with branch
      deletion; `main` CI green.

#### Files to create / modify

- `.github/workflows/ci.yml`, `docs/tasks/phase-07-testing.md`, `docs/DEVELOPMENT_PLAN.md`,
  `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer hardening CI and closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 7 tasks 7.1-7.4 are implemented on branch
feat/phase-07-testing.

CURRENT PHASE: 7, Task 7.5 of 5 (LAST: phase close).

PRECONDITIONS
- Tasks 7.1-7.4 committed; both coverage suites and e2e green locally.

REQUIRED READING (only these)
- docs/tasks/phase-07-testing.md (all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Finalize ci.yml, audit the phase, open the PR, obtain and resolve the GitHub Copilot review,
merge with CI green.

DELIVERABLES
1. ci.yml: replace tolerant recursive steps with explicit sequential steps: lint, typecheck,
   build api, build web, api test:cov, web test:cov, api test:e2e (keep job names stable; one
   suite at a time).
2. Re-run every Verification command from 7.1-7.4; fix anything red.
3. Update this file (header, index, log), the plan dashboard, the tasks README.
4. `gh pr create --title "test: reference-bar coverage and variant e2e with hardened ci"
   --body <summary incl. coverage numbers and the variant list>`; request the GitHub Copilot
   code review (`gh pr edit --add-reviewer copilot-pull-request-reviewer[bot]` or the UI);
   address EVERY finding with threads resolved citing fix SHAs.
5. `gh pr merge --squash --delete-branch` only with CI green and no unresolved threads; then
   `git switch main && git pull`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never merge with a failing check; never bypass hooks or checks.

Verification:
- `gh pr view --json state` shows MERGED; latest main run green with the new step set; the
  phase branch is gone from origin and local.

Completion Protocol:
1. In docs/tasks/phase-07-testing.md set this task's Status to ✅, tick checkboxes, set header
   Status ✅ and Progress 5/5, append `- 7.5 ✅ <date> <summary>`.
2. Flip the Phase 7 row to ✅ in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md; set Phase 8
   as active.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->
