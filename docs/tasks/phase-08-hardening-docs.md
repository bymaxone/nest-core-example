# Phase 8: Mutation, Docs, README & Export Audit

> **Status**: 🔄 In Progress · **Progress**: 1 / 5 tasks · **Last updated**: 2026-07-17
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-8-mutation-docs-readme--export-audit)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §7, §18, §21

## Context

The final phase: mutation testing hardens assertion quality on top of the 100% coverage
(Phase 7), the export audit proves every shipped library export is demonstrated, and the public
face (README with journeys, CHANGELOG) is polished. When this phase merges, the repository is
the complete, verifiable usage reference for `@bymax-one/nest-core`.

## Rules-of-phase

1. Mutation runs only on top of a green Phase 7 (100% coverage + full E2E); it is a hardening
   pass, not a test-writing pass.
2. Surviving mutants are killed with assertions on observable behavior; the only sanctioned
   exception is a proven-equivalent mutant, documented with a reason both inline and in the
   survivors table.
3. The export audit reads the library's shipped `.d.ts` files from `node_modules`, never a
   hardcoded export list.
4. Mutation runs are long: execute them one app at a time, never concurrently.
5. `.github/workflows/ci.yml` is a thin caller of the org reusable pipeline. Closing this phase
   must flip its `run-export-audit: true` and `run-mutation: true` inputs and add the
   `audit:exports` script plus each app's `mutation` script(s) the reusable expects, rather than
   hand-writing new CI steps.

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §7 (the matrix the audit enforces), §18 (thresholds)
- [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) Appendix B

## Task index

| ID  | Task                                                          | Status | Priority | Size | Depends on |
| --- | -------------------------------------------------------------- | ------ | -------- | ---- | ---------- |
| 8.1 | Branch + Stryker toolchain (api + web) + baseline records      | ✅     | P0       | M    | Phase 7    |
| 8.2 | Survivor hardening to thresholds (api 100, web 90)             | 📋     | P0       | L    | 8.1        |
| 8.3 | Export audit script + CI job                                   | 📋     | P0       | M    | Phase 7    |
| 8.4 | Final README, CHANGELOG and journeys                           | 📋     | P0       | M    | 8.3        |
| 8.5 | Phase close: audit, dashboards, PR + Copilot review + merge    | 📋     | P0       | S    | 8.1-8.4    |

## Tasks

### Task 8.1: Branch + Stryker toolchain (api + web) + baseline records

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 7

#### Description

Stryker configured per app (jest-runner for api, vitest-runner for web, `coverageAnalysis:
perTest`, incremental mode, mutate sets excluding tests/config/vendored UI), `mutation` scripts,
git/lint ignores for Stryker artifacts, and the baseline run recorded in `docs/stryker/`.

#### Acceptance criteria

- [x] `apps/api/stryker.config.json` (thresholds high 100 / low 100 / break 100) and
      `apps/web/stryker.config.json` (high 100 / low 95 / break 90; `lib/**` mutated fully,
      `components/ui/**` excluded).
- [x] Scripts `mutation` + `mutation:incremental` per app; `.stryker-tmp/` and `reports/`
      ignored by git, lint, prettier.
- [x] Baseline executed one app at a time; scores + survivor inventory recorded in
      `docs/stryker/BASELINE.md`; `docs/stryker/HISTORY.md` started (append-only).

#### Files to create / modify

- `apps/api/stryker.config.json`, `apps/web/stryker.config.json`, both `package.json`s,
  `.gitignore`, `docs/stryker/BASELINE.md`, `docs/stryker/HISTORY.md`

#### Agent prompt

````
You are a senior test engineer introducing mutation testing to a fully covered codebase.

PROJECT: nest-core-example (api: Jest; web: Vitest; both at 100% coverage from Phase 7).

CURRENT PHASE: 8 (Mutation, Docs, README & Export Audit), Task 8.1 of 5 (FIRST).

PRECONDITIONS
- Phase 7 merged (coverage 100 both apps, e2e green).

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §18 (thresholds table)

TASK
Configure Stryker for both apps, run the baselines sequentially, and record them.

DELIVERABLES
1. `git switch -c feat/phase-08-hardening-docs` (NEVER `git checkout -b`).
2. apps/api/stryker.config.json: jest-runner, coverageAnalysis perTest, mutate src/**/*.ts
   minus *.spec.ts, *.module.ts, main.ts, *.d.ts; thresholds { high: 100, low: 100, break:
   100 }; incremental true.
3. apps/web/stryker.config.json: vitest-runner, ignoreStatic true, mutate lib/**/*.ts +
   components/**/*.tsx minus tests and components/ui/**; thresholds { high: 100, low: 95,
   break: 90 }; incremental true.
4. Scripts + ignores per the acceptance criteria.
5. Run `pnpm --filter @nest-core-example/api mutation` and THEN (never concurrently)
   `pnpm --filter @nest-core-example/web mutation`; record scores + every survivor (file, line,
   mutator) in docs/stryker/BASELINE.md; start HISTORY.md with the run row.
6. Commit: `test(repo): stryker toolchain with recorded baselines (8.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- One mutation run at a time (long-running; memory-bound); do not harden yet (that is the next
  task); no em dashes.

Verification:
- Both baseline runs completed with reports; BASELINE.md lists scores and survivors.

Completion Protocol:
1. In docs/tasks/phase-08-hardening-docs.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 8.1 ✅ <date> <summary with both
   baseline scores>` to the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 8.2: Survivor hardening to thresholds (api 100, web 90)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: L
- **Depends on**: 8.1

#### Description

The concentrated hardening session: kill every killable survivor with real assertions on
observable behavior until the api holds `break: 100` and the web holds `break: 90` (with
`lib/**` at 100). Proven-equivalent mutants are documented, never silently disabled.

#### Acceptance criteria

- [ ] `pnpm --filter @nest-core-example/api mutation` passes at `break: 100` (zero surviving
      non-equivalent mutants).
- [ ] `pnpm --filter @nest-core-example/web mutation` passes at `break: 90` with `lib/**`
      mutants fully killed.
- [ ] Every equivalent mutant carries a `// Stryker disable next-line <Mutator>: <reason>`
      in source AND a row in `docs/stryker/BASELINE.md`'s equivalents table.
- [ ] `docs/stryker/HISTORY.md` updated with the final run rows.

#### Files to create / modify

- Test files across both apps, `docs/stryker/BASELINE.md`, `docs/stryker/HISTORY.md`

#### Agent prompt

````
You are a senior test engineer killing surviving mutants with behavioral assertions.

PROJECT: nest-core-example. Stryker baselines exist (8.1) on branch
feat/phase-08-hardening-docs.

CURRENT PHASE: 8, Task 8.2 of 5 (MIDDLE).

PRECONDITIONS
- Task 8.1 done; BASELINE.md lists every survivor.

REQUIRED READING (only these)
- docs/stryker/BASELINE.md (the survivor inventory: your work list)

TASK
Harden the suites until the thresholds hold; document genuine equivalents.

DELIVERABLES
1. For each survivor: strengthen or add a test asserting the observable behavior the mutant
   changes (boundary values, emitted shapes, call counts); re-run incrementally
   (`mutation:incremental`), one app at a time.
2. For each provable equivalent: the inline Stryker disable comment with a reason + the
   equivalents table row. Keep these to a minimum; a mutant a test could kill is never
   "equivalent".
3. Update BASELINE.md final scores and HISTORY.md.
4. Commit(s): `test(api|web): kill mutation survivors in <area> (8.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never lower a threshold, never widen the exclude list to pass, never run both apps' mutation
  concurrently; scenario comments on new it() blocks; no em dashes.

Verification:
- Api mutation exits 0 at break 100; web mutation exits 0 at break 90; the equivalents table
  matches the inline disables one to one.

Completion Protocol:
1. In docs/tasks/phase-08-hardening-docs.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 8.2 ✅ <date> <final scores>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 8.3: Export audit script + CI job

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 7

#### Description

The CI-enforceable proof of goal G1: `scripts/audit-library-exports.mjs` parses the shipped
`.d.ts` of all three subpaths from `node_modules`, word-boundary-searches the `apps/` corpus,
and fails on any undocumented export unless listed in `.audit-ignore.json` with a written
reason; wired as an `audit:exports` script and a CI step.

> **Update**: the "CI step" is now the `run-export-audit: true` input on `ci.yml`'s thin call
> into the org reusable pipeline (`node-ci.yml@v1`), not a hand-written step — see
> `docs/AUTOPILOT.md`.

#### Acceptance criteria

- [ ] The script parses `node_modules/@bymax-one/nest-core/dist/{index,pagination/index,health/index}.d.ts`
      export names (zero-dependency: `node:fs` + a conservative regex over `export` statements).
- [ ] Every export found is word-boundary-matched in `apps/**` sources; misses fail with a
      clear list; `.audit-ignore.json` entries require a `reason` field.
- [ ] `pnpm audit:exports` exits 0 on the current corpus; a temporary fake miss (self-test flag)
      proves the failure path.
- [ ] CI step added after the test steps.

#### Files to create / modify

- `scripts/audit-library-exports.mjs`, `.audit-ignore.json`, `package.json` (script),
  `.github/workflows/ci.yml`

#### Agent prompt

````
You are a senior tooling engineer writing a zero-dependency export-usage audit.

PROJECT: nest-core-example. The Feature Coverage Matrix (spec §7) promises every library export
is demonstrated; this script enforces it forever. Branch feat/phase-08-hardening-docs.

CURRENT PHASE: 8, Task 8.3 of 5 (MIDDLE).

PRECONDITIONS
- Phase 7 merged; the library installed in node_modules.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7 (intro: the CI-enforceable rule)

TASK
Write scripts/audit-library-exports.mjs + .audit-ignore.json and wire audit:exports into CI.

DELIVERABLES
1. The script (node:fs/node:path only): extract exported identifiers from the three shipped
   .d.ts files (export declarations and export { ... } lists; ignore type-only re-export
   duplicates); scan apps/**/*.{ts,tsx} excluding tests for word-boundary usage; print a table
   of unused exports and exit 1 unless each is in .audit-ignore.json with a reason.
2. .audit-ignore.json seeded empty (or with genuinely unused-by-design entries, each with a
   reason).
3. Root script audit:exports; ci.yml step after the test steps.
4. Commit: `feat(repo): library export-usage audit wired into ci (8.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Zero third-party dependencies in the script (supply-chain rule for CI-path tooling); JSDoc
  header; timeless comments; no em dashes.

Verification:
- `pnpm audit:exports` exits 0; temporarily adding a fake export name to the scan list makes it
  exit 1 with a readable report (then remove the temporary change).

Completion Protocol:
1. In docs/tasks/phase-08-hardening-docs.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 8.3 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 8.4: Final README, CHANGELOG and journeys

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 8.3

#### Description

The polished public face in the sibling house style: centered header with badges, "What's
inside" checklist mapped to the coverage matrix, quick start (`pnpm i && pnpm dev`, no infra),
the endpoints table, the curl journeys (envelope tour, slow request, cursor walk + corruption,
readiness flip, metrics growth), the pages gallery, and the CHANGELOG 0.1.0 entry.

#### Acceptance criteria

- [ ] `README.md`: header + badges (CI, license, Node, library version), what's inside,
      quick start, endpoints table (§11.1), five documented curl journeys with expected
      outputs, dashboard pages table, architecture ASCII, links to the three docs.
- [ ] `CHANGELOG.md` 0.1.0 entry summarizing the delivered surface.
- [ ] Every README link resolves; every journey command verified against the running app.
- [ ] Docs cross-references consistent (spec §24 reconciliation note honored if any drift was
      found during Phases 1-7).

#### Files to create / modify

- `README.md`, `CHANGELOG.md`

#### Agent prompt

````
You are a senior technical writer finishing a reference repository's public face.

PROJECT: nest-core-example. Everything is built and verified; the README stub from Phase 0
must become the definitive front page. Branch feat/phase-08-hardening-docs.

CURRENT PHASE: 8, Task 8.4 of 5 (MIDDLE).

PRECONDITIONS
- Tasks 8.1-8.3 done; app boots with `pnpm dev`.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §11.1 (endpoints), §11.2 (journeys), §13.2 (pages)
- The README of a sibling example (node_modules is not needed: mirror the structure described
  in the spec's house-style references)

TASK
Write the final README and the CHANGELOG 0.1.0 entry, verifying every command shown.

DELIVERABLES
1. README.md per the acceptance criteria; run every curl journey against the booted app and
   paste real (trimmed) outputs.
2. CHANGELOG.md 0.1.0.
3. Commit: `docs(repo): final readme with verified journeys and changelog (8.4)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- English, professional, honest (no claims beyond what the audit + tests prove); no em dashes;
  no absolute local paths.

Verification:
- A link checker pass (manual or scripted) finds no dead relative links; the journeys reproduce.

Completion Protocol:
1. In docs/tasks/phase-08-hardening-docs.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 8.4 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 8.5: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 8.1, 8.2, 8.3, 8.4

#### Description

The final phase close: full-project audit (coverage matrix fully ✅, all gates green),
dashboards synchronized, the PR with the Copilot review, and the completion report making the
repository officially the canonical usage reference.

#### Acceptance criteria

- [ ] Full gate sweep green: lint, typecheck, builds, both coverage suites at 100, e2e,
      mutation thresholds, `audit:exports`.
- [ ] Spec §7 matrix reviewed row by row; every row ✅ (or ⛔ with a written reason).
- [ ] Dashboards consistent (5/5; plan shows 9/9 phases ✅ after merge).
- [ ] PR opened; Copilot review requested and fully addressed; squash-merged with branch
      deletion; `main` CI green.

#### Files to create / modify

- `docs/tasks/phase-08-hardening-docs.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/tasks/README.md`,
  `docs/TECHNICAL_SPECIFICATION.md` (matrix status column only)

#### Agent prompt

````
You are a senior engineer closing the final phase of a reference repository.

PROJECT: nest-core-example. Phase 8 tasks 8.1-8.4 are implemented on branch
feat/phase-08-hardening-docs.

CURRENT PHASE: 8, Task 8.5 of 5 (LAST: phase close, final of the project).

PRECONDITIONS
- Tasks 8.1-8.4 committed; all gates green locally.

REQUIRED READING (only these)
- docs/tasks/phase-08-hardening-docs.md (all acceptance criteria)
- docs/TECHNICAL_SPECIFICATION.md §7 (the matrix to flip to ✅)

TASK
Run the full gate sweep, flip the coverage matrix, synchronize dashboards, open the PR, obtain
and resolve the GitHub Copilot review, merge with CI green.

DELIVERABLES
1. Gate sweep, sequential: pnpm lint; pnpm typecheck; both builds; api test:cov; web test:cov;
   api test:e2e; api mutation (incremental); web mutation (incremental); pnpm audit:exports.
   Fix anything red first.
2. Review spec §7 row by row against the codebase; every row's Status column confirmed ✅.
3. Update this file, the plan dashboard (Phase 8 ✅, project 9/9 after merge), the tasks README.
4. `gh pr create --title "chore: mutation hardening, export audit and final docs" --body
   <completion report: scores, matrix summary, gate results>`; request the GitHub Copilot code
   review (`gh pr edit --add-reviewer copilot-pull-request-reviewer[bot]` or the UI); address
   EVERY finding, resolving threads with fix SHAs.
5. `gh pr merge --squash --delete-branch` only with CI green and no unresolved threads; then
   `git switch main && git pull` and confirm main is green.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never merge with a failing check; never bypass hooks or checks.

Verification:
- `gh pr view --json state` shows MERGED; latest main run green; no phase branch remains on
  origin or locally.

Completion Protocol:
1. In docs/tasks/phase-08-hardening-docs.md set this task's Status to ✅, tick checkboxes, set
   header Status ✅ and Progress 5/5, append `- 8.5 ✅ <date> <completion summary>`.
2. Flip the Phase 8 row to ✅ in docs/DEVELOPMENT_PLAN.md (project complete: 9/9) and
   docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->

- 8.1 ✅ 2026-07-17 Stryker wired for both apps (jest/vitest runners, perTest, ignoreStatic,
  incremental); baselines recorded: api 77.81%, web 84.22%; artifacts git/lint/prettier ignored.
