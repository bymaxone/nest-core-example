# Autopilot Config — nest-core-example

> Per-project parameters for /bymax-workflow:autopilot. Reviewed and
> approved by the operator before the first run. The planning docs own WHAT
> to build; this file owns HOW the chain runs.

## Identity

- **Project root**: /Users/maximiliano/Documents/MyApps/bymax-one/nest-core-example
- **GitHub repo**: bymaxone/nest-core-example (visibility: private)
- **Default branch**: main
- **Product summary**: The reference/dogfood application for the
  `@bymax-one/nest-core@0.1.0` library. A pnpm monorepo with two apps: a NestJS 11 API
  (`apps/api`, TypeScript 5.9 strict, Zod validation, no database — in-memory seeded catalog)
  that demonstrates every library surface (error envelope, request timing, `./pagination`,
  `./health`, metrics), and a Next.js 16 dashboard (`apps/web`) rendering six demo pages.
  The one defining constraint: the library is **not yet published to npm** and is consumed
  from the sibling local checkout via `"@bymax-one/nest-core": "file:../../../nest-core"`
  (the same pattern as `nest-cache-example`). The `file:` protocol packs the library
  respecting its `files`/`exports` map, so the example still validates the packaged
  `exports` surface — never a `workspace:` member, never a `link:`, never a `paths` alias,
  never copied code.
- **Roadmap file**: docs/DEVELOPMENT_PLAN.md
- **Tasks index**: docs/tasks/README.md
- **Phases**: 9 phases / 42 tasks (phase files docs/tasks/phase-NN-*.md)

## External preconditions

| Applies to | Check (exit 0 = OK) | On failure |
|---|---|---|
| phases 1+ | `test -f ../nest-core/dist/index.d.ts && test -f ../nest-core/dist/pagination/index.d.ts && test -f ../nest-core/dist/health/index.d.ts` (run from the repo root) | run `pnpm -C ../nest-core build` ONCE to compile the sibling library (produces only its `dist/` output — no source edits, no commits in the sibling repo), then re-check; if the build itself fails, mark Phase 1 ⛔ blocked on the broken local build (name it in both dashboards) and STOP — the operator fixes the library |

The library lives at `/Users/maximiliano/Documents/MyApps/bymax-one/nest-core` and is
consumed via `file:../../../nest-core` from `apps/api`. Because `file:` deps are packed at
install time, **a rebuild of the library only reaches this repo after a fresh
`pnpm install`** — if library behavior looks stale during a fix cycle, re-install before
diagnosing.

Docker is **not** launch-blocking: the stack has zero infrastructure requirements. The
`docker-compose.yml` authored in Phase 5 is an optional `tools` profile (Prometheus scraper);
no gate executes it. E2E suites run supertest over the in-process app, no containers.

## Model policy

| Phase | Model | Rationale |
|---|---|---|
| 0 | sonnet | mechanical scaffold on a fully specified checklist (tooling, CI, community files) |
| 1 | inherit | first contact with the packaged library — invented APIs / wrong subpath resolution are the failure mode; phase is small (S) so the strong tier is cheap |
| 2 | inherit | the architectural core: `forRootAsync` wiring, AsyncLocalStorage correlation, Symbol-token DI, ring-buffer sink — defines the house patterns every later phase copies |
| 3 | sonnet | feature work on established wiring; the `./pagination` types were already probed in Phase 1 and the task file specifies every endpoint and edge case |
| 4 | sonnet | matrix-driven failure injection — every trigger and expected `BYMAX_*` code is enumerated row by row in the spec §7.3 |
| 5 | inherit | first functional use of `./health` runtime semantics (indicator timeouts, hanging-check diagnostics) and the optional `prom-client` peer — subtle behaviors, not just types |
| 6 | sonnet | UI pages on an established API contract and a verbatim design system (`docs/design_system.html`, sibling apps) |
| 7 | sonnet | testing to a fully specified bar: enumerated E2E variants, coverage thresholds, config permutations |
| 8 | inherit | final hardening/audit phase: mutation-survivor analysis, export audit, public-facing README — first-pass judgment matters |

Fix sub-agents always escalate to **inherit** when a phase stalls on review/CI findings.

**Heavy phases** (silent-death watch widened to ~120 min): **7** (full E2E + dual coverage
suites) and **8** (Stryker mutation runs on both apps).

## Gates

| Gate (local command) | Active from |
|---|---|
| `pnpm install --frozen-lockfile` on a clean checkout | phase 0 |
| `pnpm lint && pnpm typecheck && pnpm format:check` | phase 0 |
| commitlint (Conventional Commits, enforced by husky) | phase 0 |
| `pnpm --filter api test` — probe test lands, `--passWithNoTests` removed | phase 1 |
| `pnpm --filter api test` — 100% coverage on every new/changed file | phase 2 |
| `pnpm --filter api build` | phase 2 |
| `pnpm --filter web build` (`next build`) | phase 6 |
| `pnpm --filter web test` (Vitest) — 100% on new/changed files | phase 6 |
| `pnpm test:cov` both apps at 100/100/100/100; `pnpm test:e2e` green with every route + variant | phase 7 |
| Stryker: api `break: 100`, web `break: 90` (`lib/**` at 100); `pnpm audit:exports` exits 0 | phase 8 |

**Test-suite memory discipline (hard rule):** one suite at a time, sequentially —
`maxWorkers: '50%'` pinned in Jest and Vitest configs, `NODE_OPTIONS=--max-old-space-size=4096`
as the guard, `pnpm -r --workspace-concurrency=1` for recursive scripts. Never fan out
parallel test agents. This is doubly critical here: the local `file:` library dependency is
reloaded into every test worker's module graph, the exact pattern that has OOM-crashed
machines on sibling `*-example` repos.

**Expected-skip CI checks**: CodeQL, OpenSSF Scorecard, and any other public-only workflow are
**visibility-gated with a runtime condition** (job/workflow-level
`if: github.event.repository.visibility == 'public'`, equivalently
`${{ !github.event.repository.private }}`) — never a hardcoded on/off. While the repo is
private they evaluate to `skipping` (counts as pass); the moment it is flipped to public they
self-activate with **no code change**. Design the whole repo (README, badges, links, security
posture) as if it were already public.

## Invariant greps

Each command must print nothing. They run in every implementer's phase-wide gate pass
(scoped to `apps/` so the planning docs stay exempt).

```bash
# no suppression comments anywhere in app code
grep -rnE "@ts-ignore|@ts-expect-error|@ts-nocheck|eslint-disable" apps/ --include='*.ts' --include='*.tsx' --include='*.mjs'

# env access only through the validated schema
grep -rn "process\.env" apps/api/src/ --include='*.ts' | grep -v "config/env.schema.ts"

# the library is consumed via file: from the sibling checkout — never workspace-linked,
# symlinked, or aliased (file: is the ONE allowed protocol)
grep -rnE "\"@bymax-one/nest-core\": *\"(workspace:|link:)" apps/ package.json
grep -rn "@bymax-one/nest-core" apps/*/tsconfig*.json

# no plan-stage references in committed code (timeless comments)
grep -rniE "phase [0-9]|fase [0-9]|P[0-9]-[0-9]" apps/ --include='*.ts' --include='*.tsx'

# no .gitkeep placeholders, no Swagger, no em dashes in app code
find apps/ -name '.gitkeep' -o -name '.keep'
grep -rn "@nestjs/swagger" apps/
grep -rn "—" apps/ --include='*.ts' --include='*.tsx'

# no AI-attribution trailers in history added by this chain
git log --format='%B' origin/main..HEAD | grep -iE "co-authored-by|generated with"
```

## Security invariants & review focus

From spec §20 (Security & Safety) — auditable statements every `/security-review` and
`/bymax-quality:code-review` pass must check:

- **No secrets, ever.** The example needs none; `.env.example` carries only non-sensitive
  defaults and the secret scan stays clean.
- **`exposeInternals` is wired to `NODE_ENV !== 'production'`** — the production collapse
  (internals never leaked in prod mode) is unit-proven, not assumed.
- **Cursors are unsigned and carry ordering keys only** — never sensitive data; a tampered
  cursor must return `BYMAX_VALIDATION_FAILED`, not an internal error.
- **CORS restricted to `WEB_ORIGIN`** — no wildcard origins.
- **Supply chain**: committed lockfile + `pnpm install --frozen-lockfile` in CI, SHA-pinned
  GitHub Actions, least-privilege workflow `permissions`, dependency review on PRs.
- **Failure-injection endpoints only ever produce error responses** and the README states
  they must not ship in a real service.

Per-phase focus for the security-sensitive rows of the model policy:

| Phase | Review focus |
|---|---|
| 0 | CI workflow permissions (least privilege), SHA-pinned actions, frozen lockfile |
| 2 | envelope/`exposeInternals` wiring, `x-request-id` echo (no header-value trust beyond echo), Zod env validation fails fast |
| 3 | cursor tamper handling, input validation on create DTO, no internals in `BYMAX_NOT_FOUND` payloads |
| 4 | prod-mode collapse proof — unknown throws never leak stack/internals when `exposeInternals` is false |
| 8 | README security notes present; export audit does not weaken any gate |

## Review bot

- **Reviewer**: `copilot-pull-request-reviewer[bot]`, **auto-requested by the org ruleset**
  `copilot-code-review` on every PR and re-run on every push (`review_on_push: true`,
  `review_draft_pull_requests: true`). No manual `--add-reviewer` is required; issuing it is a
  harmless redundant safety net (may report "already requested").
- **Review-bot timeout**: 15 minutes — a request pending this long with no review submitted
  is treated as bot-unresponsive: the request is removed, a factual PR comment records it,
  and the gate proceeds CI-only (the implementer's zero-findings review floor already ran
  before the PR opened).

## Merge policy

- **Method**: squash (`required_linear_history` forbids merge commits; delete branch on merge —
  always, local + remote, with printed proof)
- **Grace window**: 5 minutes since last push
- **Review-bot timeout**: 15 minutes (see Review bot above)
- **Stall limit**: 3 full fix cycles on the same phase → 🟡/⛔ + notify + STOP

### Branch protection (rulesets, not classic protection)

- **`main` is PR-only** (`protect-default-branch`: no direct push, no force-push, no
  deletion). The ruleset requires **only** a PR + linear history + auto Copilot review;
  `required_approving_review_count: 0` and there are **no required status checks**, so the
  merge-blocking conjunction (CI green + all bot threads resolved + grace elapsed) is the
  **orchestrator's own gate**, enforced in software here, not by GitHub.
- Because `main` rejects direct pushes, **phase dashboard updates ride inside the phase's own
  PR** (the implementer's phase-close already edits `DEVELOPMENT_PLAN.md`, `tasks/README.md`,
  and the phase file — they land on `main` when the PR merges). The orchestrator does **not**
  push a separate post-merge `docs(plan): mark P<N> complete` commit to `main`.
- Any orchestrator-only doc change (this config, marking a phase ⛔ Blocked, a dashboard
  correction after a post-merge audit) goes through its **own short PR**, squash-merged the
  same way — never a direct push.

## Custom conventions

- **Orchestration override on the task files**: the phase files tell their last task to open
  the PR, address findings, and merge. Under autopilot the implementer stops after opening
  the PR and requesting the Copilot review — **the orchestrator owns everything from
  "PR opened" onward** (waiting, fixes, merge, dashboard finalization). An implementer
  claiming it merged is confabulating; verify with `gh`.
- **Branching**: one branch per phase, `git switch -c feat/phase-NN-<slug>` (never
  `git checkout -b` — a local hook hard-blocks it).
- **Commits/PRs**: Conventional Commits `<type>(<scope>): <subject> (N.M)`; never any
  `Co-Authored-By`, "Generated with", or AI-attribution line in commits, PR titles, PR
  bodies, or comments.
- **Token economy for implementers**: jump to the task block with `Read` offset/limit; read
  only the REQUIRED READING sections of the plan/spec; consume the library via its installed
  README and `.d.ts` (`node_modules/@bymax-one/nest-core/`) only — never read the library's
  source checkout at `../nest-core`.
- **Design system (canonical reference: `nest-auth-example`)**: `apps/web` must be visually
  and structurally **identical** to the sibling `nest-auth-example/apps/web` — copy its shell,
  layout, shared UI components (`components/`, `components.json`, `lib/` presentational
  helpers), Tailwind config, Geist fonts, and design tokens **verbatim**, adapting only the
  page content and the data layer to nest-core's demo domain. `docs/design_system.html` is the
  visual spec; `nest-auth-example` is the source of truth for the actual component code.
  Same stack: Tailwind v4, shadcn `new-york`, `lucide-react`, Geist, forced dark, TanStack
  Query, sonner. When the two disagree, match `nest-auth-example`.
- **Public-repo readiness**: the repository is private today but **will be made public**. Any
  workflow or feature that only works (or only matters) on a public repo — CodeQL, OpenSSF
  Scorecard, dependency review, README badges, public links — must be present and gated by a
  runtime visibility condition (see the Gates section), inert while private and self-activating
  when public. Never assume permanent privacy; never hardcode a public-only step off.
- **Code sizing & style**: functions ≤ 50 lines, files ≤ 800, `@fileoverview` + `@layer`
  header per file, JSDoc on every export, English-only timeless comments, zero `any`,
  zero suppression comments, no `.gitkeep`, no em dashes in code or docs, no Swagger.
- **Sequential execution track**: phases 3/4/5 are code-parallel on paper, but the chain
  runs strictly one implementer at a time — the plan's parallelism notes never license
  two implementers at once.
- **Status legend (the only one)**: 📋 ToDo · 🔄 In Progress · 👀 Review · ✅ Done ·
  ⛔ Blocked · 🟡 Partial. `docs/DEVELOPMENT_PLAN.md` is the canonical dashboard;
  `docs/tasks/README.md` only mirrors it — update the plan first.
