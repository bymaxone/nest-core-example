# Phase 5: Health Indicators & Metrics (API)

> **Status**: 🔄 In Progress · **Progress**: 4 / 5 tasks · **Last updated**: 2026-07-17
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-5-health-indicators--metrics-api)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §12.4, §12.5, §16, §17, §7.6, §7.7

## Context

The last API feature phase: the full `./health` surface (three demo indicators with runtime
toggles proving up, down, and timeout semantics) and the full metrics surface (enabled by
default in this example, the custom counter against the injected registry, and the optional
Prometheus scrape profile). The disabled-path proofs (no route, prom-client never loaded) are
specified here and asserted exhaustively in Phase 7's variant suites.

## Rules-of-phase

1. Indicators are honest demonstrations: `event-loop` measures something real; `flaky` and
   `hanging` are clearly labeled demo toggles.
2. `prom-client` is imported only through the library's lazy registry; application code never
   imports it at top level (a grep gate protects this).
3. Docker remains fully optional; nothing in the app depends on the Prometheus profile.
4. 100% unit coverage per task; tests sequential (`maxWorkers '50%'`).

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §7.6 (rows 52-59), §7.7 (rows 60-70), §12.4, §12.5, §17
- `node_modules/@bymax-one/nest-core/README.md` health + metrics sections

## Task index

| ID  | Task                                                         | Status | Priority | Size | Depends on |
| --- | ------------------------------------------------------------- | ------ | -------- | ---- | ---------- |
| 5.1 | Branch + demo health indicators (event-loop, flaky, hanging)  | ✅     | P0       | M    | Phase 2    |
| 5.2 | Health toggle endpoints + readiness flip proofs               | ✅     | P0       | S    | 5.1        |
| 5.3 | Metrics: custom counter + registry wiring proofs              | ✅     | P0       | M    | Phase 2    |
| 5.4 | Optional Prometheus profile (compose + scrape config)         | ✅     | P1       | S    | 5.3        |
| 5.5 | Phase close: audit, dashboards, PR + Copilot review + merge   | 👀     | P0       | S    | 5.1-5.4    |

## Tasks

### Task 5.1: Branch + demo health indicators (event-loop, flaky, hanging)

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 2

#### Description

Three `IHealthIndicator` implementations collected into `BYMAX_HEALTH_INDICATORS`:
`event-loop` (always up, reports a measured lag detail), `flaky` (state held in a service,
toggleable up/down), and `hanging` (when armed, sleeps past `HEALTH_INDICATOR_TIMEOUT_MS` so
the library reports it down by timeout).

#### Acceptance criteria

- [x] Branch `feat/phase-05-health-metrics` created with `git switch -c`.
- [x] The three indicators implement the library contract exactly (`name`, `check()`); each has
      a full unit spec (up path, down path, detail shape).
- [x] `core/core.module.ts` binds them under the token; `GET /health/ready` reflects all three.
- [x] The hanging indicator, when armed, never rejects by itself: the timeout conversion is the
      library's job and the test asserts the `down` entry carries the timeout diagnostic (the
      down-by-timeout assertion lands with the readiness proof suite in Task 5.2).
- [x] 100% unit coverage.

#### Files to create / modify

- `apps/api/src/health-demo/event-loop.indicator.ts`,
  `apps/api/src/health-demo/flaky.indicator.ts`,
  `apps/api/src/health-demo/hanging.indicator.ts`,
  `apps/api/src/health-demo/health-demo.module.ts` (+ specs),
  `apps/api/src/core/core.module.ts`

#### Agent prompt

````
You are a senior NestJS engineer implementing health indicators against a published contract.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core. The library serves
GET /health/live and /health/ready and aggregates IHealthIndicator implementations bound to the
BYMAX_HEALTH_INDICATORS multi-token, converting rejections/timeouts to down entries.

CURRENT PHASE: 5 (Health Indicators & Metrics), Task 5.1 of 5 (FIRST).

PRECONDITIONS
- Phase 2 merged (module wired; health enabled with HEALTH_INDICATOR_TIMEOUT_MS=2000 in dev).

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7.6 rows 52-58, §12.4
- node_modules/@bymax-one/nest-core/README.md, health section (exact contract names)

TASK
Implement the event-loop, flaky and hanging indicators and bind them as the multi-provider set.

DELIVERABLES
1. `git switch -c feat/phase-05-health-metrics` (NEVER `git checkout -b`).
2. event-loop.indicator.ts: measures event-loop delay with a setImmediate timestamp delta;
   always up with { lagMs } detail.
3. flaky.indicator.ts: reads a FlakyStateService (in the same module) holding 'up' | 'down';
   returns the state with a { toggledAt } detail.
4. hanging.indicator.ts: reads a HangStateService flag; when armed, awaits a sleep longer than
   the configured indicator timeout (read the number via @Inject(BYMAX_CORE_OPTIONS)); when
   disarmed, returns up instantly.
5. health-demo.module.ts exporting the state services; core.module.ts binds the three
   indicators via { provide: BYMAX_HEALTH_INDICATORS, useClass/useExisting, multi: true }.
6. Full specs. Commit: `feat(api): demo health indicators for up, down and timeout paths (5.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Explicit @Inject with Symbol tokens; TS strict; no suppressions; @fileoverview + @layer;
  JSDoc; timeless English comments; no em dashes; tests sequential.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + `curl -s localhost:3001/health/ready` returns status ok with three up checks.

Completion Protocol:
1. In docs/tasks/phase-05-health-metrics.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 5.1 ✅ <date> <summary>` to the
   Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 5.2: Health toggle endpoints + readiness flip proofs

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: S
- **Depends on**: 5.1

#### Description

The control surface the dashboard uses: `POST /health-demo/flaky?status=up|down` and
`POST /health-demo/hang?enabled=true|false`, plus the proofs that readiness flips 200 ↔ 503,
that a down indicator hides nothing, and that the hanging indicator is reported down by timeout
with its diagnostic.

#### Acceptance criteria

- [x] Both toggle endpoints Zod-validated, returning the new state.
- [x] Proof specs: flaky down → `/health/ready` 503 with `status: 'error'`, flaky check down,
      event-loop still up in the same response; hang armed → its check down with the timeout
      diagnostic while others stay up; everything back up → 200.
- [x] Liveness (`/health/live`) stays 200 through all of it.
- [x] 100% unit coverage.

#### Files to create / modify

- `apps/api/src/health-demo/health-demo.controller.ts` (+ spec),
  `apps/api/src/health-demo/health-demo.module.ts`

#### Agent prompt

````
You are a senior NestJS engineer proving readiness aggregation semantics.

PROJECT: nest-core-example. The three demo indicators exist (5.1) on branch
feat/phase-05-health-metrics.

CURRENT PHASE: 5, Task 5.2 of 5 (MIDDLE).

PRECONDITIONS
- Task 5.1 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7.6 rows 53, 57-58, §12.4
- node_modules/@bymax-one/nest-core/README.md, health response contract

TASK
Add the toggle endpoints and the readiness flip proof suites.

DELIVERABLES
1. health-demo.controller.ts: POST /health-demo/flaky?status=, POST /health-demo/hang?enabled=
   (zod-validated), returning { name, state }.
2. Proof specs driving the real health route through supertest on a production-wired test
   module: 200 all-up baseline; 503 with flaky down while event-loop stays visible and up;
   hang armed reported down by timeout with a diagnostic detail; recovery back to 200.
3. Commit: `feat(api): health toggles with readiness flip proofs (5.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Keep the demo timeout short (the dev env sets 2000ms) so suites stay fast; never assert
  exact durations. TS strict; no suppressions; JSDoc; timeless comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + toggle flaky down via curl + `curl -si localhost:3001/health/ready | head -1` shows
  503; toggle back up shows 200.

Completion Protocol:
1. In docs/tasks/phase-05-health-metrics.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 5.2 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 5.3: Metrics: custom counter + registry wiring proofs

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 2

#### Description

The metrics demonstration: a `catalog_lookups_total` counter registered against the injected
`BYMAX_METRICS_REGISTRY` and incremented by a demo endpoint, plus the assertions that the
scrape contains the default HTTP metrics with bounded labels, the default labels, the process
metrics, and the custom counter. Application code never imports `prom-client` directly.

#### Acceptance criteria

- [x] `metrics-demo` module: `POST /metrics-demo/lookup` increments `catalog_lookups_total`
      (counter created lazily through the injected registry, typed via the registry's own
      types, no top-level `prom-client` import in `src/`).
- [x] Scrape assertions (supertest on `GET /metrics`): `http_requests_total` and
      `http_request_duration_seconds` present with `method`/`route`/`status_code` labels only;
      `app="nest-core-example"` default label present; a `process_` metric present;
      `catalog_lookups_total` grows after the demo endpoint fires.
- [x] Grep gate enforced in a dedicated suite: no static peer import under `apps/api/src/`.
- [x] 100% unit coverage.

#### Files to create / modify

- `apps/api/src/metrics-demo/metrics-demo.service.ts`,
  `apps/api/src/metrics-demo/metrics-demo.controller.ts`,
  `apps/api/src/metrics-demo/metrics-demo.module.ts` (+ specs), `apps/api/src/app.module.ts`

#### Agent prompt

````
You are a senior observability engineer wiring custom metrics through an injected registry.

PROJECT: nest-core-example. Metrics are enabled in the dev env (METRICS_ENABLED=true); the
library exposes GET /metrics and injects a lazily created prom-client Registry via
BYMAX_METRICS_REGISTRY. Branch feat/phase-05-health-metrics.

CURRENT PHASE: 5, Task 5.3 of 5 (MIDDLE).

PRECONDITIONS
- Phase 2 merged; tasks 5.1-5.2 on the branch.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7.7 rows 63-67, 69, §12.5, §16
- node_modules/@bymax-one/nest-core/README.md, metrics section

TASK
Register the custom counter through the injected registry and pin the scrape content.

DELIVERABLES
1. metrics-demo.service.ts: @Inject(BYMAX_METRICS_REGISTRY); create-or-get a Counter named
   catalog_lookups_total (help text, no extra labels) using the registry's getSingleMetric
   pattern so repeated module init stays safe; increment().
2. metrics-demo.controller.ts POST /metrics-demo/lookup; module; AppModule registration.
3. Scrape spec: supertest GET /metrics asserting the default HTTP metrics with the three
   bounded labels only, the app default label, one process_ metric, and the counter growth.
4. An import-hygiene spec: read the src tree and assert no file imports prom-client directly
   (the injected registry is the only path).
5. Commit: `feat(api): custom counter via the injected metrics registry (5.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No top-level prom-client import anywhere under src/. TS strict; no suppressions; JSDoc;
  timeless comments; no em dashes; tests sequential.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- `grep -rn "from 'prom-client'" apps/api/src/` prints nothing.
- Boot + fire the demo endpoint twice + `curl -s localhost:3001/metrics | grep
  catalog_lookups_total` shows the counter at 2.

Completion Protocol:
1. In docs/tasks/phase-05-health-metrics.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 5.3 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 5.4: Optional Prometheus profile (compose + scrape config)

- **Status**: ✅ Done
- **Priority**: P1
- **Size**: S
- **Depends on**: 5.3

#### Description

The optional, clearly non-mandatory infrastructure: a `docker-compose.yml` whose only service
is a Prometheus under the `tools` profile, scraping the API every 5s, with a commented scrape
config for learners. Nothing in the app depends on it.

#### Acceptance criteria

- [x] `docker-compose.yml` with the single `prometheus` service, `profiles: ['tools']`,
      `127.0.0.1:9090` binding, read-only config mount.
- [x] `docker/prometheus/prometheus.yml` targeting `host.docker.internal:3001/metrics`, 5s
      interval, commented.
- [x] Root scripts `tools:up` / `tools:down`; README note (one paragraph) in the compose file
      header comment explaining the profile is optional.
- [x] `docker compose --profile tools config` validates (exit 0); the default config lists no
      services, keeping `pnpm dev` infrastructure-free.

#### Files to create / modify

- `docker-compose.yml`, `docker/prometheus/prometheus.yml`, `package.json` (scripts)

#### Agent prompt

````
You are a senior platform engineer adding an optional observability profile.

PROJECT: nest-core-example. The API serves /metrics (5.3). The app must keep zero mandatory
infrastructure. Branch feat/phase-05-health-metrics.

CURRENT PHASE: 5, Task 5.4 of 5 (MIDDLE).

PRECONDITIONS
- Task 5.3 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §17 (Local Stack & Docker)

TASK
Add the optional Prometheus tools profile and its commented scrape config.

DELIVERABLES
1. docker-compose.yml: prometheus service only (prom/prometheus pinned tag), profile tools,
   localhost-bound 9090, ro config mount; header comment stating everything is optional.
2. docker/prometheus/prometheus.yml: 5s scrape of host.docker.internal:3001, commented for
   learners (and the Linux extra_hosts note for host-gateway).
3. Root scripts tools:up (`docker compose --profile tools up -d`) and tools:down.
4. Commit: `chore(repo): optional prometheus scrape profile (5.4)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No default (profile-less) services; the repo must keep `pnpm dev` infrastructure-free. No em
  dashes; timeless comments.

Verification:
- `docker compose config --profile tools` exits 0 (or `docker compose --profile tools config`
  per the installed CLI syntax).

Completion Protocol:
1. In docs/tasks/phase-05-health-metrics.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 5.4 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 5.5: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 👀 Review
- **Priority**: P0
- **Size**: S
- **Depends on**: 5.1, 5.2, 5.3, 5.4

> **Note:** acceptance audited, dashboards synced, and the PR opened with the Copilot review
> auto-requested. The review-to-merge loop is owned by the orchestrator; this task closes to ✅
> once the PR merges to `main` with CI green.

#### Description

Standard phase close: re-verify 5.1-5.4, synchronize dashboards, open the PR, obtain and
resolve the GitHub Copilot review, merge with CI green.

#### Acceptance criteria

- [ ] All verification commands of 5.1-5.4 re-run green.
- [ ] Dashboards consistent (5/5); PR opened; Copilot review requested and fully addressed;
      squash-merged with branch deletion; `main` CI green.

#### Files to create / modify

- `docs/tasks/phase-05-health-metrics.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 5 tasks 5.1-5.4 are implemented on branch
feat/phase-05-health-metrics.

CURRENT PHASE: 5, Task 5.5 of 5 (LAST: phase close).

PRECONDITIONS
- Tasks 5.1-5.4 committed; local gates green.

REQUIRED READING (only these)
- docs/tasks/phase-05-health-metrics.md (all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Audit the phase, update dashboards, open the PR, obtain and resolve the GitHub Copilot code
review, merge with CI green.

DELIVERABLES
1. Re-run every Verification command from 5.1-5.4; fix anything red first.
2. Update this file (header, index, log), the plan dashboard, the tasks README.
3. `gh pr create --title "feat: health indicators and metrics surface" --body <professional
   summary>`; request the GitHub Copilot code review (`gh pr edit --add-reviewer
   copilot-pull-request-reviewer[bot]` or the UI); address EVERY finding, resolving threads
   with the fix SHA.
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
1. In docs/tasks/phase-05-health-metrics.md set this task's Status to ✅, tick checkboxes, set
   header Status ✅ and Progress 5/5, append `- 5.5 ✅ <date> <summary>`.
2. Flip the Phase 5 row to ✅ in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md; Phase 6
   becomes active once Phases 3 and 4 are also ✅.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->

- 5.1 ✅ 2026-07-17 event-loop, flaky, and hanging indicators collected into `BYMAX_HEALTH_INDICATORS`; `/health/ready` reflects all three; 100% unit coverage.
- 5.2 ✅ 2026-07-17 flaky/hang toggle endpoints (Zod-validated) with readiness-flip proofs: 200↔503, one failure hides nothing, hang down-by-timeout carries `timedOutAfterMs`; 100% coverage.
- 5.3 ✅ 2026-07-17 `metrics-demo` custom `catalog_lookups_total` counter via injected `BYMAX_METRICS_REGISTRY` (lazy `prom-client`, no static import); scrape proofs for default HTTP metrics, bounded/default labels, process metrics, counter growth; import-hygiene gate; 100% coverage.
- 5.4 ✅ 2026-07-17 optional `tools`-profile `docker-compose.yml` + commented `docker/prometheus/prometheus.yml` (5s scrape of `host.docker.internal:3001`), root `tools:up`/`tools:down` scripts; compose config validates and the default profile has zero services.
- 5.5 👀 2026-07-17 acceptance audited (readiness 200↔503, hang down-by-timeout diagnostic, `/metrics` default+custom with default labels, 100% coverage), dashboards synced (Phase 4 → ✅), PR opened with the Copilot review auto-requested; merge owned by the orchestrator.
