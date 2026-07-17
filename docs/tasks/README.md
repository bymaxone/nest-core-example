# Development Tasks: nest-core-example

> **Last updated:** 2026-07-17
> **Source roadmap:** [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) · **Spec:** [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md)

Tasks live **one file per phase** in this folder (`phase-NN-<slug>.md`). Each file is
self-contained: context, rules-of-phase, reference docs, task index, tasks (each with a
four-backtick **Agent prompt** executable by a fresh agent) and a completion log.

> **The canonical phase status lives in the [plan's Progress Dashboard](../DEVELOPMENT_PLAN.md#progress-dashboard).**
> This index only mirrors it: update the plan first, then this table.

## External precondition (not a phase)

`@bymax-one/nest-core` lives in the sibling local checkout (`../nest-core`) and is **not
published to npm for now** - the example consumes it via
`"@bymax-one/nest-core": "file:../../../nest-core"` in `apps/api`. Phase 1 and everything
after it require the library's `dist/` to be built, i.e. all three subpath `.d.ts` entries
present; see the [plan's External Precondition](../DEVELOPMENT_PLAN.md#external-precondition).
If the check fails, mark Phase 1 ⛔ with the missing build named and stop cleanly; the
operator rebuilds with `pnpm -C ../nest-core build`.

## Phases (files in this folder)

| Phase | File                                                                     | Tasks | Status |
| ----- | ------------------------------------------------------------------------ | ----- | ------ |
| 0     | [`phase-00-repo-foundation.md`](./phase-00-repo-foundation.md)           | 5 / 5 | ✅     |
| 1     | [`phase-01-library-consumption.md`](./phase-01-library-consumption.md)   | 3 / 3 | ✅     |
| 2     | [`phase-02-api-skeleton-wiring.md`](./phase-02-api-skeleton-wiring.md)   | 5 / 5 | ✅     |
| 3     | [`phase-03-catalog-pagination.md`](./phase-03-catalog-pagination.md)     | 0 / 4 | 🔄     |
| 4     | [`phase-04-failures-latency.md`](./phase-04-failures-latency.md)         | 0 / 4 | 📋     |
| 5     | [`phase-05-health-metrics.md`](./phase-05-health-metrics.md)             | 0 / 5 | 📋     |
| 6     | [`phase-06-web-dashboard.md`](./phase-06-web-dashboard.md)               | 0 / 6 | 📋     |
| 7     | [`phase-07-testing.md`](./phase-07-testing.md)                           | 0 / 5 | 📋     |
| 8     | [`phase-08-hardening-docs.md`](./phase-08-hardening-docs.md)             | 0 / 5 | 📋     |
|       | **Total**                                                                | **13 / 42** | 🔄 |

**Status legend:** 📋 ToDo · 🔄 In Progress · 👀 Review · ✅ Done · ⛔ Blocked · 🟡 Partial
Sizes: **XS/S** (< ~100 LoC), **M** (~100-250), **L** (~250+). Priorities: **P0** (blocking),
**P1** (important), **P2** (nice-to-have).

---

## Execution guide for agents

> Read before executing any task.

### Token economy

1. Do not load a whole phase file: jump to your task block (`Read` with `offset`/`limit`).
2. Do not load the whole plan or spec: each task lists REQUIRED READING with exact sections.
3. Do not read the library's source checkout (`../nest-core`): consume its installed README
   and `.d.ts` (`node_modules/@bymax-one/nest-core/`) only.

### Branch & PR flow (mandatory, one PR per phase)

1. The FIRST task of each phase creates the branch: `git switch -c feat/phase-NN-<slug>`
   (never `git checkout -b`).
2. All tasks of the phase commit to that branch with Conventional Commits:
   `<type>(<scope>): <subject> (N.M)`.
3. The LAST task of each phase (phase close) audits the acceptance criteria, updates the
   dashboards, opens the PR via `gh pr create`, requests the **GitHub Copilot code review**,
   addresses every finding, and merges only with CI green (`gh pr merge --squash
   --delete-branch`).
4. Never add `Co-Authored-By`, "Generated with", or any AI-attribution line to commits, PR
   titles, PR bodies, or comments.

### Self-update protocol (after every task)

1. Task block status + acceptance checkboxes.
2. Task index row + the phase header progress counter.
3. Phase completion log (append `- N.M ✅ YYYY-MM-DD <summary>`).
4. The [plan dashboard](../DEVELOPMENT_PLAN.md#progress-dashboard) (canonical) and this index.

### Blocked / review

- Blocked: `Status: ⛔` + a `> **Blocker:** ...` note under the task header; no destructive
  commits.
- Failing acceptance after 2 red-green cycles: `Status: 👀` + an inline note.

---

## Project-wide constraints (every task)

- The example consumes `@bymax-one/nest-core` only via `file:../../../nest-core` (the packed
  sibling checkout); never a `workspace:` member, never a `link:` symlink, never a `paths`
  alias, never copied code.
- TS strict, zero `any`, zero suppression comments; functions ≤ 50 lines; files ≤ 800;
  `@fileoverview` + `@layer` header; JSDoc on every export; English-only timeless comments.
- 100% coverage on both apps by Phase 7; every `it()` carries a scenario comment.
- Test suites run sequentially with `maxWorkers: '50%'`; never fan out parallel test agents.
- No `.gitkeep`, no em dashes in application code (enforced on `apps/`; the design-system HTML
  and Markdown docs are exempt), no Swagger.
- CI gates every PR from Phase 0; CodeQL/Scorecard are conditional until the repo is public.
