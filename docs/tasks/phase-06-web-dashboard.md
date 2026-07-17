# Phase 6: Dashboard: Shell + All Pages

> **Status**: 🔄 In Progress · **Progress**: 2 / 6 tasks · **Last updated**: 2026-07-17
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-6-dashboard-shell--all-pages)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §13, §14, §12

## Context

Every API surface exists (Phases 3-5). This phase delivers `apps/web`: the Next.js 16 dashboard
built to the shared Bymax design system ([`../design_system.html`](../design_system.html)),
visually indistinguishable from the sibling example apps, with six pages that make each library
behavior operable in the browser: Overview, Error Envelope Playground, Latency Lab, Pagination,
Health Console, and Metrics View.

## Rules-of-phase

1. Build to the design system verbatim: forced dark, brand orange `#ff6224`, glass surfaces,
   Geist Sans + Mono, 8pt rhythm, the sibling shell (64px topbar, 250px grouped sidebar). Do
   not invent a new visual language.
2. The dashboard is a thin client: TanStack Query for request/response, bounded polling for
   live feels, no direct library imports (it consumes the HTTP API and the mirrored envelope
   type).
3. The mirrored `ErrorEnvelope` type and `BYMAX_*` code list in `lib/envelope.ts` are pinned by
   a unit test against the documented contract.
4. `pnpm --filter web build` must pass before the phase closes; component unit tests land here,
   full coverage completion happens in Phase 7.
5. CI (`.github/workflows/ci.yml`) is a thin caller of the org reusable pipeline. Closing this
   phase must flip its `has-web: true` input now that `apps/web` exists, so the reusable's web
   build (and later e2e-web) job stops being skipped.

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §13 (frontend design), §14 (design system), §12 (scenarios)
- [`../design_system.html`](../design_system.html) (open in a browser; includes the recreation guide)

## Task index

| ID  | Task                                                        | Status | Priority | Size | Depends on    |
| --- | ------------------------------------------------------------ | ------ | -------- | ---- | ------------- |
| 6.1 | Branch + Next.js skeleton + design-system shell              | ✅     | P0       | L    | Phases 3, 4, 5 |
| 6.2 | Typed API client + mirrored envelope + Overview page         | ✅     | P0       | M    | 6.1           |
| 6.3 | Errors Playground + Latency Lab pages                        | 📋     | P0       | L    | 6.2           |
| 6.4 | Pagination page (offset + cursor + corrupt-cursor)           | 📋     | P0       | M    | 6.2           |
| 6.5 | Health Console + Metrics View pages                          | 📋     | P0       | M    | 6.2           |
| 6.6 | Phase close: audit, dashboards, PR + Copilot review + merge  | 📋     | P0       | S    | 6.1-6.5       |

## Tasks

### Task 6.1: Branch + Next.js skeleton + design-system shell

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: L
- **Depends on**: Phases 3, 4, 5

#### Description

The `apps/web` package: Next.js 16 App Router, React 19, Tailwind v4, shadcn `new-york`, Geist
fonts, forced dark, and the Bymax shell (topbar, grouped sidebar with the six routes, glass
cards) built to `docs/design_system.html`.

#### Acceptance criteria

- [x] Branch `feat/phase-06-web-dashboard` created with `git switch -c`.
- [x] `apps/web` scaffolded (App Router, TS strict, Tailwind v4 tokens per the design system,
      `components.json` shadcn new-york, Geist Sans/Mono, forced `dark` on `<html>`).
- [x] Shell components: `Topbar` (64px), `Sidebar` (250px, groups Observe / Labs / System,
      orange active state), `AppShell`; brand wordmark `nest-core-example` in mono.
- [x] Providers: TanStack Query + sonner `Toaster`.
- [x] `pnpm --filter web build` succeeds; placeholder pages render inside
      the shell for all six routes.

#### Files to create / modify

- `apps/web/` (package.json, next config, tailwind config, `app/layout.tsx`,
  `app/providers.tsx`, `app/globals.css`, `components/layout/*`, `lib/utils.ts`, six route
  placeholders)

#### Agent prompt

````
You are a senior frontend engineer recreating a shared design system in a new dashboard.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core. The API (localhost:3001)
serves catalog, failures, latency, timing, health and metrics endpoints. apps/web does not
exist yet.

CURRENT PHASE: 6 (Dashboard), Task 6.1 of 6 (FIRST).

PRECONDITIONS
- Phases 3, 4, 5 merged; API boots locally.

REQUIRED READING (only these)
- docs/design_system.html (the full visual contract + AI recreation guide at the end)
- docs/TECHNICAL_SPECIFICATION.md §13.2 (pages), §14 (identity)

TASK
Scaffold apps/web with Next.js 16 + Tailwind v4 + shadcn new-york and build the Bymax shell
with six placeholder routes.

DELIVERABLES
1. `git switch -c feat/phase-06-web-dashboard` (NEVER `git checkout -b`).
2. apps/web package (name @nest-core-example/web): Next 16, React 19, Tailwind v4 via
   @tailwindcss/postcss, shadcn new-york base components (button, card, badge, input, select,
   table, tabs, tooltip, skeleton, sonner), geist fonts, TanStack Query v5, sonner.
3. app/layout.tsx: forced dark class, Geist fonts, Providers (QueryClient + Toaster).
4. components/layout/: Topbar (64px, status area placeholder), Sidebar (250px; groups: Observe
   [Overview, Latency, Health], Labs [Errors, Pagination], System [Metrics]; orange active
   state), AppShell.
5. globals.css + tailwind tokens matching design_system.html (brand #ff6224, glass surfaces,
   radii, monospace headings).
6. Placeholder pages for /, /errors, /latency, /pagination, /health, /metrics rendering a
   titled glass Card inside the shell.
7. .env.example with NEXT_PUBLIC_API_URL=http://localhost:3001.
8. Commit: `feat(web): next 16 skeleton with the shared design-system shell (6.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Do not invent visuals: every token comes from design_system.html. No next-themes, no light
  mode. TS strict; no suppressions; timeless English comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/web build` exits 0.
- `pnpm --filter @nest-core-example/web dev` renders the shell with the six nav entries (then
  stop it).

Completion Protocol:
1. In docs/tasks/phase-06-web-dashboard.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 6.1 ✅ <date> <summary>` to the
   Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 6.2: Typed API client + mirrored envelope + Overview page

- **Status**: ✅ Done
- **Priority**: P0
- **Size**: M
- **Depends on**: 6.1

> **Note:** also introduces `lib/health-api.ts` and `lib/timing-api.ts` ahead of their listed
> tasks (6.5 and 6.3), since the Overview page's status strip needs `/health/ready` and
> `/timing/samples` immediately. Both modules are extended, not recreated, when their own
> tasks land.

#### Description

The data layer: `lib/envelope.ts` (mirrored `ErrorEnvelope` type + the `BYMAX_*` code list,
pinned by a unit test), `lib/api-client.ts` (typed fetch wrapper returning a discriminated
result union, envelope-aware), and the Overview page: status strip (health, request count,
slow count, error count from the timing feed), library summary, quick links.

#### Acceptance criteria

- [x] `lib/envelope.ts` exports the envelope type + `BYMAX_ERROR_CODES` list; a Vitest spec
      pins field names and the 16 distinct codes covering the 17 documented catalog derivations.
- [x] `lib/api-client.ts`: `request<T>()` returning `{ ok: true, data } | { ok: false, kind:
      'envelope', error: ErrorEnvelope } | { ok: false, kind: 'transport', message: string }`.
- [x] Overview page: `StatTile` strip fed by `/health/ready` (status), `/timing/samples`
      (counts + slow), with polling; quick links to the five feature pages.
- [x] Vitest toolchain in `apps/web` (jsdom, Testing Library, `maxWorkers: '50%'`); unit specs
      for the client and envelope; `pnpm --filter web test` green (100% coverage on `lib/**`
      and the bespoke `components/shared`/`components/overview` modules).

#### Files to create / modify

- `apps/web/lib/envelope.ts` (+ spec), `apps/web/lib/api-client.ts` (+ spec),
  `apps/web/app/page.tsx`, `apps/web/components/overview/*`, `apps/web/vitest.config.ts`

#### Agent prompt

````
You are a senior frontend engineer building a typed, envelope-aware data layer.

PROJECT: nest-core-example. The shell exists (6.1) on branch feat/phase-06-web-dashboard. The
API's error contract is the library envelope: statusCode, code, message, details?,
correlationId?, timestamp, path.

CURRENT PHASE: 6, Task 6.2 of 6 (MIDDLE).

PRECONDITIONS
- Task 6.1 done; API running locally for manual checks.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §13.1 (data layer), §7.2-§7.3 (contract + codes)

TASK
Create the mirrored envelope module, the typed api client, the Vitest toolchain, and the
Overview page.

DELIVERABLES
1. lib/envelope.ts: ErrorEnvelope interface + BYMAX_ERROR_CODES as a const tuple of the 17
   documented codes + isErrorEnvelope() guard. Spec pinning both (any drift fails loudly).
2. lib/api-client.ts: request<T>(path, init?) using NEXT_PUBLIC_API_URL; parses JSON; returns
   the discriminated union; captures x-request-id into the error variant. Spec with mocked
   fetch covering ok, envelope error, non-JSON transport error.
3. vitest.config.ts: jsdom, testing-library setup, maxWorkers '50%', coverage scaffold.
4. app/page.tsx Overview per the spec: StatTile strip (health status chip, total requests,
   slow requests, error responses) polling /health/ready and /timing/samples with
   refetchInterval 3000; quick-link cards to the feature pages.
5. Commit: `feat(web): envelope-aware api client and overview page (6.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No axios; no useEffect+fetch (TanStack Query only); scenario comment on every it(); TS
  strict; no suppressions; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/web test` green; `pnpm --filter @nest-core-example/web
  build` exits 0.

Completion Protocol:
1. In docs/tasks/phase-06-web-dashboard.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 6.2 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 6.3: Errors Playground + Latency Lab pages

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: L
- **Depends on**: 6.2

#### Description

The two flagship pages. Errors: a trigger grid (one card per `BYMAX_*` code, wired to
`POST /failures/:kind` and the catalog 404/validation/seasonal routes) and the `EnvelopeViewer`
(annotated JSON, correlation id highlighted, dev-vs-prod note). Latency: delay slider firing
`GET /latency?ms=`, the `SampleFeed` table (route template, status, duration, slow badge),
a duration sparkline, and the sink-poison toggle.

#### Acceptance criteria

- [ ] `/errors`: every §7.3 code triggerable; the viewer renders the exact envelope with field
      annotations; custom-code demo (seasonal) visually distinguished from `BYMAX_*` codes.
- [ ] `/latency`: slider + fire button; samples table polling `/timing/samples` with the
      threshold displayed; slow rows badged; poison button fires `POST /timing/poison` and a
      toast confirms the next request still succeeded.
- [ ] Component unit specs for `EnvelopeViewer` and `SampleFeed` (pure rendering paths).
- [ ] `pnpm --filter web build` and unit suite green.

#### Files to create / modify

- `apps/web/app/errors/page.tsx`, `apps/web/components/errors/*` (+ specs),
  `apps/web/app/latency/page.tsx`, `apps/web/components/latency/*` (+ specs),
  `apps/web/lib/failures-api.ts`, `apps/web/lib/timing-api.ts`

#### Agent prompt

````
You are a senior frontend engineer making error contracts and request timing tangible.

PROJECT: nest-core-example. Data layer + Overview exist (6.2) on branch
feat/phase-06-web-dashboard. API surface: POST /failures/:kind (13 standard + teapot,
variant-5xx, unknown), catalog 404/validation/seasonal routes, GET /latency?ms=,
GET /timing/samples, POST /timing/poison.

CURRENT PHASE: 6, Task 6.3 of 6 (MIDDLE).

PRECONDITIONS
- Task 6.2 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §12.1, §12.2, §13.3
- docs/design_system.html (component recipes)

TASK
Build the Errors Playground and Latency Lab pages with their bespoke components.

DELIVERABLES
1. /errors: TriggerGrid (glass cards grouped 4xx / 5xx / special: teapot, variant-5xx, unknown,
   validation, not-found, seasonal), EnvelopeViewer (mono JSON with per-field annotation
   tooltips, correlationId highlighted, copy button), a prod-vs-dev callout explaining the
   collapse (static, honest).
2. /latency: DelayControl (slider 0-2000ms + fire button, mutation), SampleFeed (poll 2000ms;
   columns method/route/status/durationMs/slow badge; threshold shown in the header),
   DurationSparkline (inline SVG, last 50 samples), PoisonToggle (mutation + toast asserting
   the follow-up request succeeded).
3. lib/failures-api.ts + lib/timing-api.ts typed wrappers over the api client.
4. Unit specs for EnvelopeViewer and SampleFeed rendering paths.
5. Commit: `feat(web): errors playground and latency lab pages (6.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Design-system fidelity; TanStack Query only; TS strict; no suppressions; scenario comments;
  no em dashes.

Verification:
- `pnpm --filter @nest-core-example/web test` and build green; manual: trigger conflict shows
  BYMAX_CONFLICT in the viewer; a 600ms request shows a slow badge.

Completion Protocol:
1. In docs/tasks/phase-06-web-dashboard.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 6.3 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 6.4: Pagination page (offset + cursor + corrupt-cursor)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 6.2

#### Description

Two tabs over the seeded catalog: a numbered offset table (page/limit controls, the `meta`
object displayed raw) and a cursor "load more" table with the `CursorTrail` (each opaque cursor
shown, copyable) plus the "corrupt the cursor" button that sends a tampered value and renders
the resulting `BYMAX_VALIDATION_FAILED` envelope inline.

#### Acceptance criteria

- [ ] Offset tab: page/limit controls (clamped values reflected from `meta`), sortable-free
      simple table, raw `meta` panel.
- [ ] Cursor tab: load-more accumulation, `CursorTrail` listing every cursor used,
      `nextCursor: null` end state visible ("end of catalog"), corrupt button + inline envelope
      render.
- [ ] Unit specs for `CursorTrail` and the corrupt-cursor flow (mocked client).
- [ ] Build + unit suite green.

#### Files to create / modify

- `apps/web/app/pagination/page.tsx`, `apps/web/components/pagination/*` (+ specs),
  `apps/web/lib/catalog-api.ts`

#### Agent prompt

````
You are a senior frontend engineer visualizing two pagination models honestly.

PROJECT: nest-core-example. Data layer exists (6.2) on branch feat/phase-06-web-dashboard. API:
GET /catalog/products (offset, PageResult with meta), GET /catalog/products/cursor
(CursorResult with nextCursor), tampering a cursor yields the BYMAX_VALIDATION_FAILED envelope.

CURRENT PHASE: 6, Task 6.4 of 6 (MIDDLE).

PRECONDITIONS
- Task 6.2 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §12.3, §13.3

TASK
Build the Pagination page: offset and cursor tabs plus the corrupt-cursor demonstration.

DELIVERABLES
1. lib/catalog-api.ts: typed listOffset(page, limit) and listCursor(cursor?, limit) wrappers.
2. /pagination with Tabs: OffsetTable (controls + table + raw meta panel in mono) and
   CursorTable (load-more button accumulating items; CursorTrail component showing each cursor
   chip with copy; end-of-catalog state; CorruptCursorButton sending the last cursor reversed +
   'x' and rendering the envelope inline via EnvelopeViewer).
3. An inline note (glass callout): cursors are opaque ordering keys, unsigned, never secrets.
4. Unit specs for CursorTrail and the corrupt flow with a mocked client.
5. Commit: `feat(web): pagination page with offset, cursor and strict-rejection demo (6.4)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never parse cursors client-side (opaque by contract). Design-system fidelity; TS strict; no
  suppressions; scenario comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/web test` and build green; manual: walking to the end shows
  the terminal state; the corrupt button renders BYMAX_VALIDATION_FAILED.

Completion Protocol:
1. In docs/tasks/phase-06-web-dashboard.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 6.4 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 6.5: Health Console + Metrics View pages

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 6.2

#### Description

Health: live/ready status tiles polling the real endpoints, the `CheckList` (per-indicator
status + details), and the flaky/hanging toggles flipping readiness in front of the user.
Metrics: a refreshable raw scrape panel plus a parsed panel highlighting the default HTTP
metrics, the histogram buckets, and `catalog_lookups_total`, with a fire-traffic button.

#### Acceptance criteria

- [ ] `/health`: liveness + readiness tiles (200/503 aware), `CheckList` with per-check status
      chips and details, toggle switches wired to the health-demo endpoints, readiness flip
      observable live.
- [ ] `/metrics`: raw text panel (mono, refresh), parsed highlights (`http_requests_total`
      total, duration buckets count, custom counter value), "fire traffic" button (N requests
      via the catalog list), disabled-state explanation callout.
- [ ] Unit specs for `CheckList` and the metrics parser helper.
- [ ] Build + unit suite green.

#### Files to create / modify

- `apps/web/app/health/page.tsx`, `apps/web/components/health/*` (+ specs),
  `apps/web/app/metrics/page.tsx`, `apps/web/components/metrics/*` (+ specs),
  `apps/web/lib/health-api.ts`, `apps/web/lib/metrics-api.ts`

#### Agent prompt

````
You are a senior frontend engineer building operations pages over health and metrics contracts.

PROJECT: nest-core-example. Data layer exists (6.2) on branch feat/phase-06-web-dashboard. API:
GET /health/live, GET /health/ready ({ status, checks[] }, 200/503), POST /health-demo/flaky,
POST /health-demo/hang, GET /metrics (Prometheus text), POST /metrics-demo/lookup.

CURRENT PHASE: 6, Task 6.5 of 6 (MIDDLE).

PRECONDITIONS
- Task 6.2 done.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §12.4, §12.5, §13.3

TASK
Build the Health Console and Metrics View pages.

DELIVERABLES
1. lib/health-api.ts (typed, 503 handled as data not error) and lib/metrics-api.ts (text fetch
   + a small parseMetrics helper extracting a named metric's value/samples).
2. /health: StatusTiles (live + ready, polling 2000ms), CheckList (name, status chip, details
   mono), ToggleCard for flaky (up/down switch) and hanging (arm switch) with sonner feedback.
3. /metrics: RawScrape panel (mono, manual refresh + auto 5000ms), Highlights panel
   (http_requests_total, duration bucket count, catalog_lookups_total), FireTraffic button
   (fires 10 catalog list requests then refetches), and a callout explaining metrics are
   disabled by default in the library and what a 404 here means.
4. Unit specs for CheckList and parseMetrics.
5. Commit: `feat(web): health console and metrics view pages (6.5)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Treat 503 readiness as a rendered state, never an exception path. Design-system fidelity; TS
  strict; no suppressions; scenario comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/web test` and build green; manual: flipping flaky turns the
  readiness tile red (503) and back.

Completion Protocol:
1. In docs/tasks/phase-06-web-dashboard.md set this task's Status to ✅ (block + task index),
   tick its checkboxes, bump the header Progress, append `- 6.5 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 6.6: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 6.1-6.5

#### Description

Standard phase close plus the design-parity check: a screenshot of the shell beside a sibling
example must be indistinguishable in chrome (topbar, sidebar, cards, brand treatment).

#### Acceptance criteria

- [ ] All verification commands of 6.1-6.5 re-run green.
- [ ] Design parity confirmed and stated in the PR body (screenshot attached).
- [ ] Dashboards consistent (6/6); PR opened; Copilot review requested and fully addressed;
      squash-merged with branch deletion; `main` CI green.

#### Files to create / modify

- `docs/tasks/phase-06-web-dashboard.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 6 tasks 6.1-6.5 are implemented on branch
feat/phase-06-web-dashboard.

CURRENT PHASE: 6, Task 6.6 of 6 (LAST: phase close).

PRECONDITIONS
- Tasks 6.1-6.5 committed; web unit suite + build green locally.

REQUIRED READING (only these)
- docs/tasks/phase-06-web-dashboard.md (all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Audit the phase (including design parity), update dashboards, open the PR, obtain and resolve
the GitHub Copilot code review, merge with CI green.

DELIVERABLES
1. Re-run every Verification command from 6.1-6.5; fix anything red first.
2. Capture a screenshot of the running shell for the PR body; state the design-parity check
   result explicitly.
3. Update this file (header, index, log), the plan dashboard, the tasks README.
4. `gh pr create --title "feat: dashboard with all six library demonstration pages" --body
   <summary + screenshot>`; request the GitHub Copilot code review (`gh pr edit --add-reviewer
   copilot-pull-request-reviewer[bot]` or the UI); address EVERY finding, resolving threads
   with the fix SHA.
5. `gh pr merge --squash --delete-branch` only with CI green and no unresolved threads; then
   `git switch main && git pull`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never merge with a failing check; never bypass hooks or checks.

Verification:
- `gh pr view --json state` shows MERGED; latest main run green; the phase branch is gone from
  origin and local.

Completion Protocol:
1. In docs/tasks/phase-06-web-dashboard.md set this task's Status to ✅, tick checkboxes, set
   header Status ✅ and Progress 6/6, append `- 6.6 ✅ <date> <summary>`.
2. Flip the Phase 6 row to ✅ in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md; set Phase 7
   as active.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->

- 6.1 ✅ 2026-07-17 `apps/web` scaffolded (Next.js 16 App Router, Tailwind v4, shadcn new-york primitives, Geist, forced dark); `AppShell`/`Topbar`/`Sidebar` (Observe/Labs/System groups) built verbatim to the shared design system; six placeholder routes render inside the shell; `next typegen` wired into `typecheck` so CI's standalone type-check job works without a prior build.
- 6.2 ✅ 2026-07-17 `lib/envelope.ts` (mirrored `ErrorEnvelope` + 16-code `BYMAX_ERROR_CODES`) and `lib/api-client.ts` (envelope-aware `request<T>()`, `ok/envelope/transport` discriminated result, correlationId backfilled from `x-request-id`); `lib/health-api.ts` (503 readiness parsed as data, never a transport error) and `lib/timing-api.ts` (`summarizeSamples`) added ahead of schedule for the Overview page; Overview status strip (`StatTile`/`StatusChip`) polls `/health/ready` + `/timing/samples` every 3s; quick-link grid to the five feature pages; Vitest + Testing Library wired (`maxWorkers: '50%'`, jsdom), 63 tests green, 100% coverage on `lib/**` and the new `components/shared`/`components/overview` modules.
