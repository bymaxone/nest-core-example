# Phase 3: Catalog Domain & Pagination

> **Status**: 🔄 In Progress · **Progress**: 0 / 4 tasks · **Last updated**: 2026-07-17
> **Source roadmap**: [`../DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md#phase-3-catalog-domain--pagination)
> **Source spec**: [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §11, §12.3, §7.5

## Context

The core wiring is live (Phase 2). This phase builds the seeded in-memory product catalog that
exercises the entire `./pagination` subpath (offset with clamps, cursor with the opaque codec
and the fetch-one-extra convention), plus the `BYMAX_NOT_FOUND`, validation, and custom-code
envelope paths. No database: the repository pattern proves the library's ORM neutrality.

## Rules-of-phase

1. All pagination shaping goes through the library helpers; the repository never builds meta or
   cursors by hand.
2. The seed is deterministic (stable ids/names from a seeded generator) so E2E assertions and
   the dashboard are reproducible; `CATALOG_ORIGIN_LATENCY_MS` simulates origin cost.
3. Domain error codes never use the `BYMAX_` prefix.
4. Each task lands with 100% unit coverage on its files; tests sequential (`maxWorkers '50%'`).

## Reference docs

- [`../TECHNICAL_SPECIFICATION.md`](../TECHNICAL_SPECIFICATION.md) §11 (endpoint catalogue), §12.3 (scenario), matrix §7.5 rows 43-51
- `node_modules/@bymax-one/nest-core/README.md` pagination section

## Task index

| ID  | Task                                                         | Status | Priority | Size | Depends on |
| --- | ------------------------------------------------------------- | ------ | -------- | ---- | ---------- |
| 3.1 | Branch + seeded repository + single lookup (404 path)         | 📋     | P0       | M    | Phase 2    |
| 3.2 | Offset endpoint + Zod-validated create + seasonal domain code | 📋     | P0       | M    | 3.1        |
| 3.3 | Cursor endpoint (codec walk + strict rejection)               | 📋     | P0       | M    | 3.1        |
| 3.4 | Phase close: audit, dashboards, PR + Copilot review + merge   | 📋     | P0       | S    | 3.1-3.3    |

## Tasks

### Task 3.1: Branch + seeded repository + single lookup (404 path)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: Phase 2

#### Description

The `catalog` module skeleton: a deterministic in-memory `ProductRepository` (seeded from
`CATALOG_SEED_COUNT`, artificial latency from `CATALOG_ORIGIN_LATENCY_MS`, stable ordering by
`id`), the `Product` type, and `GET /catalog/products/:id` whose unknown-id path produces the
`BYMAX_NOT_FOUND` envelope.

#### Acceptance criteria

- [ ] Branch `feat/phase-03-catalog-pagination` created with `git switch -c`.
- [ ] `ProductRepository`: `findById`, `findPage(query)`, `findAfter(cursorKeys, limit)`
      (returns `limit` rows after the cursor position, ordered by id), all latency-simulated.
- [ ] `GET /catalog/products/:id` returns the product or throws `NotFoundException` with a
      message naming the id (the library derives `BYMAX_NOT_FOUND`).
- [ ] Seed is deterministic: same count env yields the same products across boots.
- [ ] 100% unit coverage; scenario comments on every `it()`.

#### Files to create / modify

- `apps/api/src/catalog/product.types.ts`, `apps/api/src/catalog/product.repository.ts`
  (+ spec), `apps/api/src/catalog/catalog.service.ts` (+ spec),
  `apps/api/src/catalog/catalog.controller.ts` (+ spec), `apps/api/src/catalog/catalog.module.ts`,
  `apps/api/src/app.module.ts`

#### Agent prompt

````
You are a senior NestJS engineer building a deterministic demo domain.

PROJECT: nest-core-example, reference app for @bymax-one/nest-core (pnpm monorepo, Node 24, TS
strict, Jest maxWorkers '50%'). The core wiring is live: errors already leave as the library's
envelope.

CURRENT PHASE: 3 (Catalog Domain & Pagination), Task 3.1 of 4 (FIRST).

PRECONDITIONS
- Phase 2 merged (envelope + timing live; Env type has CATALOG_SEED_COUNT and
  CATALOG_ORIGIN_LATENCY_MS).

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §10.2 (house style), §11.1 (catalog rows)
- node_modules/@bymax-one/nest-core/README.md, error mapping section

TASK
Create the catalog module: deterministic seeded repository, service, controller with the single
lookup and its 404 path.

DELIVERABLES
1. `git switch -c feat/phase-03-catalog-pagination` (NEVER `git checkout -b`).
2. product.types.ts (Product: id, name, category, priceCents, createdAt ISO string).
3. product.repository.ts: seeded generator (mulberry32 or equivalent seeded PRNG keyed by index,
   not Math.random) building CATALOG_SEED_COUNT products ordered by id; findById/findPage/
   findAfter with await-able artificial latency (setTimeout of CATALOG_ORIGIN_LATENCY_MS).
4. catalog.service.ts getProduct(id) throwing NotFoundException('Product <id> was not found')
   on miss; catalog.controller.ts GET /catalog/products/:id; catalog.module.ts; register in
   AppModule.
5. Full unit specs (determinism, latency awaited, 404 path). Commit:
   `feat(api): seeded catalog domain with single lookup (3.1)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- No ORM, no database, no Math.random in domain data. TS strict; no suppressions; functions <=
  50 lines; @fileoverview + @layer; JSDoc; timeless English comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + `curl -s localhost:3001/catalog/products/does-not-exist` returns the envelope with
  code BYMAX_NOT_FOUND and statusCode 404.

Completion Protocol:
1. In docs/tasks/phase-03-catalog-pagination.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 3.1 ✅ <date> <summary>` to
   the Completion log.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 3.2: Offset endpoint + Zod-validated create + seasonal domain code

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 3.1

#### Description

`GET /catalog/products` through `normalizePageQuery` + `buildPageResult` (clamps and meta
derived by the library), `POST /catalog/products` with a Zod DTO whose rejection surfaces as
`BYMAX_VALIDATION_FAILED`, and `GET /catalog/products/:id/seasonal` throwing a domain
`HttpException` carrying the custom code `CATALOG_OUT_OF_SEASON` (the `code` passthrough proof).

#### Acceptance criteria

- [ ] Offset endpoint: `?page=&limit=` normalized with `{ maxLimit: 50 }`; response is the
      library's `PageResult` (items + meta with derived totalPages); out-of-range inputs are
      clamped, never errors.
- [ ] Create endpoint: Zod DTO (name, category, priceCents); invalid body returns the envelope
      with `BYMAX_VALIDATION_FAILED` and one `details` entry per issue.
- [ ] Seasonal endpoint: throws `new HttpException({ code: 'CATALOG_OUT_OF_SEASON', message },
      409)`; the envelope carries the custom code verbatim.
- [ ] 100% unit coverage on changed files.

#### Files to create / modify

- `apps/api/src/catalog/catalog.controller.ts`, `apps/api/src/catalog/catalog.service.ts`,
  `apps/api/src/catalog/dto/create-product.dto.ts` (+ spec),
  `apps/api/src/common/domain-errors.ts` (+ spec)

#### Agent prompt

````
You are a senior NestJS engineer demonstrating a pagination and error-mapping surface.

PROJECT: nest-core-example. Catalog skeleton exists (3.1) on branch
feat/phase-03-catalog-pagination. Library helpers come from '@bymax-one/nest-core/pagination';
the ZodValidationPipe exists from Phase 2.

CURRENT PHASE: 3, Task 3.2 of 4 (MIDDLE).

PRECONDITIONS
- Task 3.1 done; repository findPage available.

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7.5 rows 43-45, §7.2 rows 14-15
- node_modules/@bymax-one/nest-core/README.md, pagination + error mapping sections

TASK
Add the offset list endpoint, the validated create, and the custom-code seasonal endpoint.

DELIVERABLES
1. listOffset(raw) using normalizePageQuery(raw, { maxLimit: 50 }) then repository.findPage then
   buildPageResult; controller GET /catalog/products.
2. dto/create-product.dto.ts: zod schema; controller POST /catalog/products via the
   ZodValidationPipe; service persists into the in-memory repository.
3. common/domain-errors.ts: OutOfSeasonError extends HttpException with response
   { code: 'CATALOG_OUT_OF_SEASON', message } and status 409; controller GET
   /catalog/products/:id/seasonal throws it for a deterministic subset (e.g. category ===
   'seasonal').
4. Full unit specs incl. clamp table (page 0 -> 1, limit 999 -> 50, defaults). Commit:
   `feat(api): offset pagination, validated create and custom-code passthrough (3.2)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Never hand-build PageResult meta; the library derives it. Domain codes never use the BYMAX_
  prefix. TS strict; no suppressions; JSDoc; timeless comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + `curl -s 'localhost:3001/catalog/products?page=0&limit=999'` shows meta.page 1 and
  meta.limit 50; an invalid POST body returns code BYMAX_VALIDATION_FAILED with details.

Completion Protocol:
1. In docs/tasks/phase-03-catalog-pagination.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 3.2 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 3.3: Cursor endpoint (codec walk + strict rejection)

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: M
- **Depends on**: 3.1

#### Description

`GET /catalog/products/cursor` through `normalizeCursorQuery`, the repository's fetch-one-extra
query, and `buildCursorResult` with `encodeCursor`/`decodeCursor`: walking to the final page
yields `nextCursor: null`, and a tampered cursor is rejected as `BYMAX_VALIDATION_FAILED`.

#### Acceptance criteria

- [ ] Cursor endpoint: `?cursor=&limit=` normalized; repository fetches `limit + 1` rows after
      the decoded position; `buildCursorResult` trims and derives `nextCursor` from the last
      item's ordering keys (`{ id }`).
- [ ] Walking the whole seeded catalog page by page terminates with `nextCursor: null` and
      yields every product exactly once (unit-proven).
- [ ] A tampered cursor (`not-base64url!!!` and a truncated valid cursor) returns the envelope
      with `BYMAX_VALIDATION_FAILED`.
- [ ] 100% unit coverage on changed files.

#### Files to create / modify

- `apps/api/src/catalog/catalog.controller.ts`, `apps/api/src/catalog/catalog.service.ts`
  (+ specs)

#### Agent prompt

````
You are a senior NestJS engineer implementing opaque-cursor pagination over a repository.

PROJECT: nest-core-example. Catalog offset flows exist (3.2) on branch
feat/phase-03-catalog-pagination. Codec + helpers come from '@bymax-one/nest-core/pagination'.

CURRENT PHASE: 3, Task 3.3 of 4 (MIDDLE).

PRECONDITIONS
- Task 3.1 done (repository.findAfter available).

REQUIRED READING (only these)
- docs/TECHNICAL_SPECIFICATION.md §7.5 rows 46-51, §12.3
- node_modules/@bymax-one/nest-core/README.md, cursor section (exact codec signatures)

TASK
Add the cursor list endpoint with the full walk and the strict-rejection path.

DELIVERABLES
1. service.listCursor(raw): normalizeCursorQuery(raw, { maxLimit: 50 }); decodeCursor when a
   cursor is present (let its HttpException propagate untouched); repository.findAfter(keys,
   limit + 1); buildCursorResult(rows, limit, (last) => ({ id: last.id })).
2. controller GET /catalog/products/cursor.
3. Unit specs: full-walk uniqueness + termination; first page without cursor; tampered and
   truncated cursors rejected; last-page nextCursor null. Commit:
   `feat(api): cursor pagination with opaque codec walk (3.3)`.

Constraints:
- Never add Co-Authored-By, 'Generated with', or any AI-attribution line to commits, PR titles,
  PR bodies, or comments.
- Cursors encode ordering keys only (id), never sensitive data; never parse a cursor manually.
  TS strict; no suppressions; JSDoc; timeless comments; no em dashes.

Verification:
- `pnpm --filter @nest-core-example/api test:cov` at 100%.
- Boot + walk two pages via curl confirming nextCursor changes and a corrupted cursor yields
  code BYMAX_VALIDATION_FAILED.

Completion Protocol:
1. In docs/tasks/phase-03-catalog-pagination.md set this task's Status to ✅ (block + task
   index), tick its checkboxes, bump the header Progress, append `- 3.3 ✅ <date> <summary>`.
2. Mirror progress in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

### Task 3.4: Phase close: audit, dashboards, PR + Copilot review + merge

- **Status**: 📋 ToDo
- **Priority**: P0
- **Size**: S
- **Depends on**: 3.1, 3.2, 3.3

#### Description

Standard phase close: re-verify 3.1-3.3, synchronize dashboards, open the PR, obtain and
resolve the GitHub Copilot review, merge with CI green.

#### Acceptance criteria

- [ ] All verification commands of 3.1-3.3 re-run green.
- [ ] Dashboards consistent (4/4); PR opened; Copilot review requested and fully addressed;
      squash-merged with branch deletion; `main` CI green.

#### Files to create / modify

- `docs/tasks/phase-03-catalog-pagination.md`, `docs/DEVELOPMENT_PLAN.md`,
  `docs/tasks/README.md`

#### Agent prompt

````
You are a senior engineer closing a phase with a reviewed, green PR.

PROJECT: nest-core-example. Phase 3 tasks 3.1-3.3 are implemented on branch
feat/phase-03-catalog-pagination.

CURRENT PHASE: 3, Task 3.4 of 4 (LAST: phase close).

PRECONDITIONS
- Tasks 3.1-3.3 committed; local gates green.

REQUIRED READING (only these)
- docs/tasks/phase-03-catalog-pagination.md (all acceptance criteria)
- docs/tasks/README.md (Branch & PR flow, Self-update protocol)

TASK
Audit the phase, update dashboards, open the PR, obtain and resolve the GitHub Copilot code
review, merge with CI green.

DELIVERABLES
1. Re-run every Verification command from 3.1-3.3; fix anything red first.
2. Update this file (header, index, log), the plan dashboard, the tasks README.
3. `gh pr create --title "feat: catalog domain with offset and cursor pagination" --body
   <professional summary>`; request the GitHub Copilot code review (`gh pr edit --add-reviewer
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
1. In docs/tasks/phase-03-catalog-pagination.md set this task's Status to ✅, tick checkboxes,
   set header Status ✅ and Progress 4/4, append `- 3.4 ✅ <date> <summary>`.
2. Flip the Phase 3 row to ✅ in docs/DEVELOPMENT_PLAN.md and docs/tasks/README.md; set the
   next runnable phase as active per the dependency map.
3. Commit the dashboard updates (Conventional Commits, no attribution trailers).
````

## Completion log

<!-- append: - N.M ✅ YYYY-MM-DD <one-line summary> -->
