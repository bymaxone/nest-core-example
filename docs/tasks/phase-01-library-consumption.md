# Phase 1: Library Consumption & Subpath Probes

> **Status**: 📋 ToDo · **Progress**: 0 / 3 tasks · **Last updated**: 2026-07-17
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-1-library-consumption--subpath-probes)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §4, §8

## Context

Phase 0 delivered the tooling and CI. This phase makes the repository consume
`@bymax-one/nest-core` **from the sibling local checkout** via
`"@bymax-one/nest-core": "file:../../../nest-core"` (the library is not published to npm for
now; `file:` packs it respecting its `files`/`exports` fields, so the packaged `exports` map
is still what resolves) and proves that all three subpaths (`.`, `./pagination`, `./health`)
type-resolve, before any real wiring exists. The `apps/api` workspace package is created here
as a minimal holder so the dependency has a home.

**External gate:** this phase must not start until the library's `dist/` is built. From the
repo root, this must exit 0:

```bash
test -f ../nest-core/dist/index.d.ts \
  && test -f ../nest-core/dist/pagination/index.d.ts \
  && test -f ../nest-core/dist/health/index.d.ts
```

While it fails, the phase stays ⛔ with the missing build named in the plan dashboard, and the
run stops cleanly (the operator rebuilds with `pnpm -C ../nest-core build`).

## Rules-of-phase

1. The library is an external dependency consumed only via `file:../../../nest-core`:
   never a `workspace:` member, never a `link:` symlink, never a `paths` alias, never
   copied code.
2. The library's required peers (`@nestjs/common`, `@nestjs/core`, `reflect-metadata`, `rxjs`)
   and the optional peer `prom-client` are declared in `apps/api` so they resolve to a single
   copy.
3. The probe is a compile-time resolution proof, inert at runtime, replaced by real wiring in
   Phase 2.
4. `--passWithNoTests` leaves the repository in this phase: the probe test is the first real
   suite.

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §4 (public API inventory), §8 (Library Consumption)
- [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) External Precondition

## Task index

| ID  | Task                                                        | Status | Priority | Size | Depends on |
| --- | ------------------------------------------------------------ | ------ | -------- | ---- | ---------- |
| 1.1 | Verify the local-build gate + create `apps/api` holder + dep | 📋     | P0       | S    | Phase 0    |
| 1.2 | Three-subpath probe + first unit test (drop passWithNoTests) | 📋     | P0       | S    | 1.1        |
| 1.3 | Phase close: audit, dashboards, PR + Copilot review + merge  | 📋     | P0       | S    | 1.1, 1.2   |

## Tasks

### Task 1.1: Verify the local-build gate + create `apps/api` holder + dependency

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: Phase 0

#### Description

Objectively verify the local library is built, then create the minimal `apps/api` workspace
package (package.json, tsconfig extending the base, an empty `src/` created by its first real
file in 1.2) declaring the library via `file:../../../nest-core`, its four required peers, and
the optional `prom-client`.

#### Acceptance criteria

- [ ] The local-build gate passes (`../nest-core/dist/index.d.ts`,
      `dist/pagination/index.d.ts`, `dist/health/index.d.ts` all exist); the packed library
      version (from `../nest-core/package.json`) is recorded in the completion log.
- [ ] Branch `feat/phase-01-library-consumption` created with `git switch -c`.
- [ ] `apps/api/package.json`: name `@nest-core-example/api`, deps
      `@bymax-one/nest-core@file:../../../nest-core`,
      `@nestjs/common@^11`, `@nestjs/core@^11`, `reflect-metadata@^0.2`, `rxjs@^7`,
      `prom-client@^15`; scripts `typecheck`, `test`, `build` (placeholder tsc build).
- [ ] `apps/api/tsconfig.json` extends `../../tsconfig.base.json`.
- [ ] `pnpm install` links everything; peers resolve to a single copy (`pnpm why @nestjs/core`).

#### Files to create / modify

- `apps/api/package.json`, `apps/api/tsconfig.json`

#### Agent prompt

````
You are a senior NestJS engineer wiring a reference app to consume a locally packed library.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core (pnpm monorepo, Node 24, TS
strict). Phase 0 delivered tooling + CI; apps/ is empty. The library is NOT on npm: it lives
in the sibling checkout ../nest-core and is consumed via the file: protocol, which packs it
respecting its files/exports fields (same pattern as nest-cache-example).

CURRENT PHASE: 1 (Library Consumption), Task 1.1 of 3 (FIRST).

PRECONDITIONS
- Phase 0 merged; CI green on main.
- EXTERNAL GATE: from the repo root, verify the packed library is built:
  `test -f ../nest-core/dist/index.d.ts && test -f ../nest-core/dist/pagination/index.d.ts
  && test -f ../nest-core/dist/health/index.d.ts`. Under autopilot the orchestrator builds the
  library as a precondition before spawning you, so this normally already passes. If you still
  find it failing, build it once with `pnpm -C ../nest-core build` and re-check; if it STILL
  fails, STOP and report the missing build (the orchestrator/operator marks Phase 1 ⛔ in the
  dashboards via a PR and rebuilds). Never consume the library with workspace:/link:; do NOT
  poll.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §8 (Library Consumption)
- docs/DEVELOPMENT_PLAN.md §3 (Global Conventions) + External Precondition

TASK
Create the apps/api holder package declaring the library (file:../../../nest-core) and its
peers.

DELIVERABLES
1. `git switch -c feat/phase-01-library-consumption` (NEVER `git checkout -b`).
2. apps/api/package.json per the acceptance criteria (private, type commonjs or module matching
   the sibling examples' api apps, engines node >=24).
3. apps/api/tsconfig.json extending ../../tsconfig.base.json.
4. `pnpm install`; verify single-copy peer resolution with `pnpm why @nestjs/core`.
5. Commit: `feat(api): consume @bymax-one/nest-core via local file dependency (1.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- The library resolves through its packed dist + exports map only (the file: protocol
  guarantees this); no workspace: member, no link: symlink, no paths alias, no copied code.
  Never read ../nest-core sources - only the installed node_modules artifacts. TS strict; no
  suppression comments; English-only timeless comments; no .gitkeep; no em dashes.

Verification:
- The external-gate `test` command exits 0.
- `pnpm install` exits 0; `node -p "require('./apps/api/package.json').dependencies['@bymax-one/nest-core']"` prints `file:../../../nest-core`.
- `node -p "require('./apps/api/node_modules/@bymax-one/nest-core/package.json').version"` prints the packed version.

Completion Protocol:
1. In docs/tasks/phase-01-library-consumption.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 1.1 ✅ <date> <summary
   including the packed library version>` to the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md (record the version) and
   docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 1.2: Three-subpath probe + first unit test (drop passWithNoTests)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 1.1

#### Description

A typed probe importing from all three subpaths (root, `./pagination`, `./health`) plus the
repository's first real Jest suite asserting the probe's shape, which also removes any
`--passWithNoTests` tolerance from scripts and CI.

#### Acceptance criteria

- [ ] `apps/api/src/library-probe.ts` imports and references: root (`BymaxCoreModule`, the five
      Symbol tokens, `type BymaxCoreModuleOptions`, `type RequestTimingSample`), pagination
      (`normalizePageQuery`, `buildPageResult`, `encodeCursor`, `decodeCursor`), health
      (`type IHealthIndicator`, `type HealthIndicatorResult`).
- [ ] `apps/api/jest.config.cjs` with `maxWorkers: '50%'` and coverage config scaffolded;
      `library-probe.spec.ts` asserts the probe object (every `it()` carries a scenario
      comment).
- [ ] `--passWithNoTests` (or `--if-present` tolerance for tests) removed from `apps/api`
      scripts; CI test step now genuinely runs the suite.
- [ ] `pnpm typecheck` and `pnpm test` exit 0 across the workspace.

#### Files to create / modify

- `apps/api/src/library-probe.ts`, `apps/api/src/library-probe.spec.ts`,
  `apps/api/jest.config.cjs`, `apps/api/package.json` (test script)

#### Agent prompt

````
You are a senior TypeScript engineer proving a packaged exports map end to end.

PROJECT: nest-core-example. Task 1.1 declared @bymax-one/nest-core (file:../../../nest-core,
the packed sibling checkout) in apps/api on branch feat/phase-01-library-consumption.

CURRENT PHASE: 1, Task 1.2 of 3 (MIDDLE).

PRECONDITIONS
- Task 1.1 done; `pnpm install` green.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §4.1-§4.3 (the three subpath inventories) and §8.2
- The library's installed README (node_modules/@bymax-one/nest-core/README.md) for exact names
  (never the ../nest-core source checkout)

TASK
Create the three-subpath resolution probe and the first Jest suite; remove the no-tests
tolerance.

DELIVERABLES
1. apps/api/src/library-probe.ts: a runtime-inert, fully typed probe importing from
   '@bymax-one/nest-core', '@bymax-one/nest-core/pagination', '@bymax-one/nest-core/health';
   reference every import; export a LIBRARY_PROBE const summarizing counts. @fileoverview +
   @layer header; JSDoc explaining it exists so typecheck fails loudly on exports-map drift.
2. apps/api/jest.config.cjs: ts-jest, rootDir src, maxWorkers '50%', coverage thresholds
   scaffolded at 100 (only the probe files exist, so 100 holds trivially).
3. library-probe.spec.ts asserting LIBRARY_PROBE and that decodeCursor(encodeCursor(x))
   round-trips a sample payload (pure helpers are safe to execute in unit scope).
4. Remove test tolerance: apps/api `test` script runs jest plainly; adjust the root/CI usage if
   it relied on --if-present semantics for the test step (build may keep --if-present until the
   web app exists).
5. Commit: `feat(api): add three-subpath library probe and first unit suite (1.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- If a documented name does not match the shipped .d.ts, follow the shipped .d.ts and note the
  drift in the PR body (never invent APIs). TS strict; no suppressions; scenario comment on
  every it(); no em dashes.

Verification:
- `pnpm typecheck` exits 0 (all three subpaths resolve).
- `pnpm --filter @nest-core-example/api test` exits 0 with the probe suite listed.

Completion Protocol:
1. In docs/tasks/phase-01-library-consumption.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 1.2 ✅ <date> <summary>` to
   the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 1.3: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 1.1, 1.2

#### Description

Standard phase close: re-verify 1.1-1.2, synchronize all dashboards, open the PR, obtain and
resolve the GitHub Copilot review, merge with CI green.

#### Acceptance criteria

- [ ] All verification commands of 1.1-1.2 re-run green on the branch.
- [ ] Dashboards consistent (this file 3/3, plan row, tasks README).
- [ ] PR opened, Copilot review requested, all findings addressed, squash-merged with branch
      deletion, `main` CI green.

#### Files to create / modify

- `docs/tasks/phase-01-library-consumption.md`, `docs/DEVELOPMENT_PLAN.md`,
  `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 1 tasks 1.1-1.2 are implemented on branch
feat/phase-01-library-consumption.

CURRENT PHASE: 1, Task 1.3 of 3 (LAST: phase close).

PRECONDITIONS
- Tasks 1.1-1.2 committed; `pnpm typecheck` and `pnpm test` green locally.

REQUIRED READING (only these)
- docs/tasks/phase-01-library-consumption.md (all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Audit the phase, update dashboards, open the PR, obtain and resolve the GitHub Copilot code
review, merge with CI green.

DELIVERABLES
1. Re-run every Verification command from tasks 1.1-1.2; fix anything red first.
2. Update this file's header (Progress 3/3), task index, completion log; the plan dashboard
   row; the tasks README row.
3. `gh pr create --title "feat: consume @bymax-one/nest-core with three-subpath proof" --body
   <professional summary>`; request the GitHub Copilot code review (GitHub UI reviewers panel
   or `gh pr edit --add-reviewer copilot-pull-request-reviewer[bot]`); address EVERY finding,
   resolving threads with the fix SHA.
4. Merge only with CI green and no unresolved threads: `gh pr merge --squash --delete-branch`;
   then `git switch main && git pull`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never merge with a failing check; never bypass hooks or checks.

Verification:
- `gh pr view --json state` shows MERGED; latest main run green;
  `git ls-remote --heads origin feat/phase-01-library-consumption` prints nothing.

Completion Protocol:
1. In docs/tasks/phase-01-library-consumption.md set this task's Status to ✅, tick checkboxes,
   set header Status ✅ and Progress 3/3, append `- 1.3 ✅ <date> <summary>` to the Completion
   log.
2. Flip the Phase 1 row to ✅ in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md; set Phase 2
   as the active phase.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->
