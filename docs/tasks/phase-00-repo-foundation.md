# Phase 0: Repository Foundation & CI

> **Status**: 📋 ToDo · **Progress**: 0 / 5 tasks · **Last updated**: 2026-07-06
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-0-repository-foundation--ci)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §6, §19

## Context

The repository contains only `docs/` on `main`. This phase produces a buildable pnpm monorepo
with the full Bymax toolchain and a CI workflow that gates this very phase's PR and every PR
after it. No application code and no library dependency yet (the library is not published; see
the plan's external precondition).

## Rules-of-phase

1. CI must exist before any code PR: the workflow lands here and this phase's own PR runs it.
2. CodeQL and OpenSSF Scorecard workflows ship **conditionally enabled**: guarded so they are
   inert while the repository is private and activate when it becomes public.
3. No `.gitkeep`, no empty directories, no placeholder source files.
4. Everything installed must be used by a config in this phase (no speculative dependencies).
5. One PR closes the phase; Conventional Commits throughout.

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §6 (Repository Layout), §19 (Tooling & Conventions)
- [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) §3 (Global Conventions)

## Task index

| ID  | Task                                                       | Status | Priority | Size | Depends on |
| --- | ----------------------------------------------------------- | ------ | -------- | ---- | ---------- |
| 0.1 | Branch + root workspace, TypeScript base, editor hygiene    | 📋     | P0       | S    | none       |
| 0.2 | Lint, format, git hooks, commit governance                  | 📋     | P0       | S    | 0.1        |
| 0.3 | Community files + Renovate                                  | 📋     | P1       | S    | 0.1        |
| 0.4 | CI workflows (ci + conditional codeql/scorecard)            | 📋     | P0       | M    | 0.2        |
| 0.5 | Phase close: audit, dashboards, PR + Copilot review + merge | 📋     | P0       | S    | 0.1-0.4    |

## Tasks

### Task 0.1: Branch + root workspace, TypeScript base, editor hygiene

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: none

#### Description

Create the phase branch and the root of the pnpm monorepo: workspace manifest, root scripts,
strict TypeScript base, Node pinning, and editor hygiene files. No app packages yet (they are
created by later phases); the workspace globs simply tolerate an empty `apps/`.

#### Acceptance criteria

- [ ] Branch `feat/phase-00-repo-foundation` created with `git switch -c`.
- [ ] Root `package.json`: `private: true`, `packageManager` pinning pnpm, `engines.node >=24`,
      scripts `lint`, `typecheck`, `format`, `format:check`, `test` (workspace fan-outs that
      tolerate zero packages).
- [ ] `pnpm-workspace.yaml` with `packages: ['apps/*']`; `.nvmrc` = `24`; `.npmrc` with
      `engine-strict=true` and `frozen-lockfile=true` (no registry mapping).
- [ ] `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
      ES2022 target.
- [ ] `.editorconfig` and `.gitignore` (node, dist, .next, coverage, .env).
- [ ] `pnpm install` exits 0 on a clean checkout.

#### Files to create / modify

- `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.npmrc`, `tsconfig.base.json`,
  `.editorconfig`, `.gitignore`

#### Agent prompt

````
You are a senior TypeScript platform engineer bootstrapping a reference-app monorepo.

PROJECT: nest-core-example, the reference application for @bymax-one/nest-core (NestJS 11
foundation kit). pnpm monorepo, TypeScript 5.9 strict, Node >= 24. The repo currently contains
only docs/ on main.

CURRENT PHASE: 0 (Repository Foundation & CI), Task 0.1 of 5 (FIRST).

PRECONDITIONS
- Clean working tree on main; docs/ exists; no apps/ yet.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §6 (Repository Layout) and §19 (Tooling & Conventions)
- docs/DEVELOPMENT_PLAN.md §3 (Global Conventions)

TASK
Create the phase branch and the monorepo root: workspace manifest, root scripts, strict TS base,
Node pinning, editor hygiene.

DELIVERABLES
1. Create the branch first: `git switch -c feat/phase-00-repo-foundation` (NEVER `git checkout -b`).
2. `package.json` (root): private, name `nest-core-example`, packageManager pnpm pin, engines
   node >=24, scripts: `lint` (`eslint .`), `typecheck` (recursive `tsc --noEmit` fan-out that
   tolerates zero packages, e.g. `pnpm -r --workspace-concurrency=1 exec tsc --noEmit || true`
   is NOT acceptable: use `pnpm -r --workspace-concurrency=1 run typecheck` with no packages
   yielding success), `format`/`format:check` (prettier), `test` (`pnpm -r
   --workspace-concurrency=1 run test`).
3. `pnpm-workspace.yaml` (`packages: ['apps/*']`), `.nvmrc` (`24`), `.npmrc`
   (`engine-strict=true`, `frozen-lockfile=true`).
4. `tsconfig.base.json` strict per the spec (§19).
5. `.editorconfig`, `.gitignore`.
6. Commit: `chore(repo): scaffold pnpm workspace and typescript base (0.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- TS strict, no suppression comments; English-only timeless comments (no phase/task references
  in committed files); no .gitkeep; no em dashes in any file.
- Do not create apps/ or any source file; directories appear only when real files land.

Verification:
- `pnpm install` exits 0.
- `node -p "require('./package.json').engines.node"` prints `>=24`.
- `git branch --show-current` prints `feat/phase-00-repo-foundation`.

Completion Protocol:
1. Set this task's Status to ✅ in docs/tasks/phase-00-repo-foundation.md (block + task index).
2. Tick its acceptance checkboxes; bump the header Progress counter.
3. Append `- 0.1 ✅ <date> <one-line summary>` to the Completion log.
4. Mirror progress in docs/DEVELOPMENT_PLAN.md (Progress Dashboard) and docs/tasks/README.md.
5. Commit the dashboard updates with the same Conventional style.
````

### Task 0.2: Lint, format, git hooks, commit governance

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 0.1

#### Description

ESLint 9 flat config (type-checked rules scoped to TS files), Prettier, husky hooks, lint-staged
and commitlint so Conventional Commits are enforced locally from the first commit onward.

#### Acceptance criteria

- [ ] `eslint.config.mjs` (flat, typed rules for `*.ts`/`*.tsx`, ignores for `dist`, `.next`,
      `coverage`); `pnpm lint` exits 0.
- [ ] `.prettierrc.mjs` + `pnpm format:check` exits 0.
- [ ] `.husky/pre-commit` → lint-staged; `.husky/commit-msg` → commitlint;
      `commitlint.config.mjs` extends `config-conventional`; `lint-staged.config.mjs` runs
      prettier + eslint --fix on staged files.
- [ ] `.gitmessage` template with the project scopes (`repo`, `api`, `web`, `ci`, `docs`).
- [ ] A test commit with a non-Conventional message is rejected by the hook.

#### Files to create / modify

- `eslint.config.mjs`, `.prettierrc.mjs`, `commitlint.config.mjs`, `lint-staged.config.mjs`,
  `.husky/pre-commit`, `.husky/commit-msg`, `.gitmessage`, `package.json` (prepare script,
  devDependencies)

#### Agent prompt

````
You are a senior TypeScript tooling engineer wiring lint/format/commit governance.

PROJECT: nest-core-example (pnpm monorepo, TS strict). Root scaffold exists from task 0.1 on
branch feat/phase-00-repo-foundation.

CURRENT PHASE: 0, Task 0.2 of 5 (MIDDLE).

PRECONDITIONS
- Task 0.1 merged into the phase branch (root package.json, tsconfig.base.json present).

REQUIRED READING (only these)
- docs/DEVELOPMENT_PLAN.md §3 (Global Conventions)

TASK
Add ESLint 9 flat config, Prettier, husky + lint-staged + commitlint, and the .gitmessage
template, all active locally.

DELIVERABLES
1. eslint.config.mjs: flat config, typescript-eslint typed rules scoped to *.ts/*.tsx, ignores
   dist/.next/coverage/node_modules.
2. .prettierrc.mjs (printWidth 100, singleQuote, no semicolons or the sibling style: match the
   nest-cache-example root if in doubt).
3. commitlint.config.mjs (config-conventional), lint-staged.config.mjs (prettier + eslint --fix
   on staged), .husky/pre-commit and .husky/commit-msg, `prepare: husky` script.
4. .gitmessage with scopes repo/api/web/ci/docs; set `git config commit.template .gitmessage`
   locally (document in the file header comment of .gitmessage).
5. Commit: `chore(repo): add lint, format and commit governance (0.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No suppression comments; English-only timeless comments; no em dashes.

Verification:
- `pnpm lint` and `pnpm format:check` exit 0.
- `git commit --allow-empty -m "bad message"` is REJECTED by commit-msg; a Conventional message
  passes (then drop the empty commit if created).

Completion Protocol:
1. In docs/tasks/phase-00-repo-foundation.md set this task's Status to ✅ (block +
   task index), tick its acceptance checkboxes, bump the header Progress counter, and
   append `- 0.2 ✅ <date> <one-line summary>` to the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md (Progress Dashboard) and
   docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 0.3: Community files + Renovate

- **Status**: 📋 ToDo
- **Priority**: P1
- **Size**: S
- **Depends on**: 0.1

#### Description

The public face and the update automation: license, contribution and conduct files, README
stub, changelog, agent guides, and a Renovate configuration with the grouped `@bymax-one/**`
rule (automerge minor/patch after green CI, majors labeled).

#### Acceptance criteria

- [ ] `LICENSE` (MIT, Bymax One), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant
      2.1 by reference, never transcribed), `CHANGELOG.md` (empty Unreleased section).
- [ ] `README.md` stub: one-paragraph purpose, links to the three docs, "under construction"
      note that is honest and professional.
- [ ] `CLAUDE.md` and `AGENTS.md` stubs pointing agents at `docs/` and the tasks folder.
- [ ] `renovate.json`: extends recommended, `@bymax-one/**` group with automerge for
      minor/patch, `breaking-change` label for majors.

#### Files to create / modify

- `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`,
  `AGENTS.md`, `renovate.json`

#### Agent prompt

````
You are a senior open-source maintainer preparing a repository's public face.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core. The repo is private today
and WILL become public: write everything public-grade from the start.

CURRENT PHASE: 0, Task 0.3 of 5 (MIDDLE).

PRECONDITIONS
- Task 0.1 done (root scaffold) on branch feat/phase-00-repo-foundation.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §1 (Purpose) for the README stub wording

TASK
Add LICENSE, CONTRIBUTING, CODE_OF_CONDUCT (by reference), CHANGELOG, README stub, CLAUDE.md,
AGENTS.md, and renovate.json with the @bymax-one/** grouped rule.

DELIVERABLES
1. The eight files listed above. CODE_OF_CONDUCT references Contributor Covenant 2.1 by link,
   never pastes it.
2. renovate.json:
   {"extends": ["config:recommended"], "packageRules": [
     {"groupName": "bymax-one libs", "matchPackageNames": ["@bymax-one/**"],
      "matchUpdateTypes": ["minor", "patch"], "automerge": true},
     {"matchPackageNames": ["@bymax-one/**"], "matchUpdateTypes": ["major"],
      "automerge": false, "labels": ["breaking-change"]}]}
3. Commit: `docs(repo): add community files and renovate config (0.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- English only; no em dashes; nothing that cannot be public (no internal paths, no private
  project names beyond the @bymax-one family).

Verification:
- `npx renovate-config-validator renovate.json` exits 0 (or, if unavailable offline, `node -e
  "JSON.parse(require('fs').readFileSync('renovate.json'))"` exits 0).
- README links resolve to existing files.

Completion Protocol:
1. In docs/tasks/phase-00-repo-foundation.md set this task's Status to ✅ (block +
   task index), tick its acceptance checkboxes, bump the header Progress counter, and
   append `- 0.3 ✅ <date> <one-line summary>` to the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md (Progress Dashboard) and
   docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 0.4: CI workflows (ci + conditional codeql/scorecard)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 0.2

#### Description

The gate that everything else passes through. A `ci.yml` running install, lint, typecheck,
build and test sequentially (test with `--passWithNoTests` until the first real suite lands in
Phase 1), plus CodeQL and OpenSSF Scorecard workflows written to be inert while the repository
is private and active once it is public.

#### Acceptance criteria

- [ ] `.github/workflows/ci.yml`: triggers on `pull_request` + `push` to `main`; pnpm setup
      before node setup with `cache: pnpm`; `pnpm install --frozen-lockfile`; jobs/steps in
      order lint → typecheck → build → test; actions SHA-pinned; least-privilege `permissions`.
- [ ] Test step tolerates the empty workspace (documented as removed when the first suite
      lands).
- [ ] `.github/workflows/codeql.yml` and `.github/workflows/scorecard.yml` guarded with
      `if: ${{ !github.event.repository.private }}` (job level) so they activate on the public
      flip without edits.
- [ ] The phase PR (task 0.5) shows the `ci` workflow green.

#### Files to create / modify

- `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, `.github/workflows/scorecard.yml`

#### Agent prompt

````
You are a senior CI engineer setting up the pipeline that gates every future PR.

PROJECT: nest-core-example (pnpm monorepo, Node 24, TS strict). Repo is PRIVATE today, will be
PUBLIC later: public-only features must be conditional, not omitted.

CURRENT PHASE: 0, Task 0.4 of 5 (MIDDLE).

PRECONDITIONS
- Tasks 0.1-0.2 done on branch feat/phase-00-repo-foundation (lint/typecheck/format run locally).

REQUIRED READING (only these)
- docs/DEVELOPMENT_PLAN.md §3 (Global Conventions) and Appendix B (Quality Gates)

TASK
Create ci.yml (install, lint, typecheck, build, test sequential) plus conditional codeql.yml and
scorecard.yml that are inert while the repository is private.

DELIVERABLES
1. .github/workflows/ci.yml: on pull_request + push(main); steps: checkout (SHA-pinned),
   pnpm/action-setup BEFORE actions/setup-node (node-version 24, cache pnpm), install
   --frozen-lockfile, `pnpm lint`, `pnpm typecheck`, `pnpm -r --workspace-concurrency=1 run
   build --if-present`, `pnpm -r --workspace-concurrency=1 run test --if-present` (workspace is
   empty today; the recursive --if-present form succeeds and hardens automatically as packages
   land). permissions: contents: read.
2. .github/workflows/codeql.yml and scorecard.yml, each with job-level
   `if: ${{ !github.event.repository.private }}`, SHA-pinned actions, least privilege.
3. Commit: `ci(repo): add ci pipeline and conditional security workflows (0.4)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No em dashes; comments in the YAML explain the conditional guard (timeless, no phase refs).
- Do NOT rename job names after this phase: branch protection will reference them.

Verification:
- `node -e "require('js-yaml')"` is NOT required: validate with `python3 -c "import yaml,glob;
  [yaml.safe_load(open(f)) for f in glob.glob('.github/workflows/*.yml')]"` exiting 0 (or any
  equivalent YAML parse check available locally).
- `git push -u origin feat/phase-00-repo-foundation` and confirm via `gh run list --branch
  feat/phase-00-repo-foundation` that the ci workflow runs and passes.

Completion Protocol:
1. In docs/tasks/phase-00-repo-foundation.md set this task's Status to ✅ (block +
   task index), tick its acceptance checkboxes, bump the header Progress counter, and
   append `- 0.4 ✅ <date> <one-line summary>` to the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md (Progress Dashboard) and
   docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 0.5: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 0.1, 0.2, 0.3, 0.4

#### Description

Close the phase: verify every acceptance criterion above, update all dashboards, open the phase
PR, request the GitHub Copilot code review, address every finding, and merge with CI green.

#### Acceptance criteria

- [ ] Every acceptance criterion of tasks 0.1-0.4 re-verified on the branch (spot-run the
      verification commands).
- [ ] Phase file header, task index, completion log, plan dashboard and tasks README all
      consistent (5/5 done).
- [ ] PR opened with a professional English title/body summarizing the foundation; Copilot
      review requested; every finding addressed or answered.
- [ ] Merged via squash with branch deletion; `main` CI green after merge.

#### Files to create / modify

- `docs/tasks/phase-00-repo-foundation.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 0 tasks 0.1-0.4 are implemented on branch
feat/phase-00-repo-foundation.

CURRENT PHASE: 0, Task 0.5 of 5 (LAST: phase close).

PRECONDITIONS
- Tasks 0.1-0.4 committed; local gates green (`pnpm lint`, `pnpm typecheck`, `pnpm format:check`).

REQUIRED READING (only these)
- docs/tasks/phase-00-repo-foundation.md (this file: all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Audit the phase, update the dashboards, open the PR, obtain and resolve the GitHub Copilot code
review, merge with CI green.

DELIVERABLES
1. Re-run every task's Verification commands; fix anything red before proceeding.
2. Update: this file's header (Status ✅ when merged, Progress 5/5), task index rows, completion
   log; docs/DEVELOPMENT_PLAN.md Progress Dashboard row for Phase 0; docs/tasks/README.md row.
3. `gh pr create --title "feat: repository foundation and CI" --body <professional summary
   with a checklist of what landed>`.
4. Request the GitHub Copilot code review on the PR (via the GitHub UI reviewers panel or
   `gh pr edit --add-reviewer copilot-pull-request-reviewer[bot]`; if unavailable, note it in
   the PR and proceed after CI). Address EVERY finding with commits; resolve threads citing the
   fix SHA.
5. Merge only when CI is green and the review has no unresolved threads:
   `gh pr merge --squash --delete-branch`. Then `git switch main && git pull`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never merge with a failing check; never bypass with --no-verify or admin merge.

Verification:
- `gh pr view --json state` shows MERGED; `gh run list --branch main --limit 1` shows success.
- `git ls-remote --heads origin feat/phase-00-repo-foundation` prints nothing.

Completion Protocol:
1. In docs/tasks/phase-00-repo-foundation.md set this task's Status to ✅ (block +
   task index), tick its acceptance checkboxes, bump the header Progress counter, and
   append `- 0.5 ✅ <date> <one-line summary>` to the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md (Progress Dashboard) and
   docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
4. Flip the Phase 0 row to ✅ in the plan dashboard and set Phase 1 as the active phase
   (or ⛔ if the local-build gate still fails; see the plan's External Precondition).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->
