# Stryker Mutation Baseline

Mutation testing hardens assertion quality on top of the 100% line/branch coverage the test
suites already hold. This file records the first (baseline) run per app and the final,
threshold-passing scores, plus the inventory of proven-equivalent mutants that are deliberately
ignored with a written reason.

Runs are executed one app at a time (never concurrently). Configuration lives in
`apps/api/stryker.config.json` (Jest runner) and `apps/web/stryker.config.json` (Vitest runner).
Both use `coverageAnalysis: perTest` and `ignoreStatic: true`.

## Thresholds

| App | high | low | break | Notes                                             |
| --- | ---- | --- | ----- | ------------------------------------------------- |
| api | 100  | 100 | 100   | Every non-equivalent mutant must be killed.       |
| web | 100  | 95  | 90    | `lib/**` held to 100; bespoke components clear 90. |

## Baseline run (first pass, before hardening)

| App | Mutation score | Killed | Survived | Timeout | Ignored (static) | Mutants |
| --- | -------------- | ------ | -------- | ------- | ---------------- | ------- |
| api | 77.81%         | 239    | 69       | 3       | 48               | 361     |
| web | 84.22%         | 555    | 104      | 0       | 41               | 700     |

### api baseline survivors by file

| File                                     | Survivors |
| ---------------------------------------- | --------- |
| src/catalog/product.repository.ts        | 23        |
| src/failures/failure-registry.ts         | 15        |
| src/core/core.config.ts                  | 14        |
| src/core/ring-buffer-timing.sink.ts      | 3         |
| src/health-demo/event-loop.indicator.ts  | 3         |
| src/config/env.schema.ts                 | 2         |
| src/metrics-demo/metrics-demo.service.ts | 2         |
| src/catalog/catalog.service.ts           | 2         |
| src/health-demo/hanging.indicator.ts     | 2         |
| src/common/zod-validation.pipe.ts        | 1         |
| src/failures/failures.service.ts         | 1         |
| src/latency/latency.controller.ts        | 1         |

### web baseline survivors by file

| File                                    | Survivors |
| --------------------------------------- | --------- |
| components/shared/envelope-viewer.tsx   | 18        |
| components/latency/duration-sparkline.tsx | 14      |
| components/overview/status-strip.tsx    | 12        |
| lib/health-api.ts                       | 11        |
| components/pagination/offset-table.tsx  | 9         |
| components/health/toggle-card.tsx       | 7         |
| components/errors/trigger-grid.tsx      | 6         |
| components/latency/sample-feed.tsx      | 4         |
| components/pagination/product-table.tsx | 4         |
| components/pagination/offset-controls.tsx | 3       |
| components/shared/stat-tile.tsx         | 3         |
| lib/env.ts                              | 2         |
| Ten more files                          | 1 each    |

## Final run (after hardening)

Filled in when the hardening pass (survivor elimination) lands. The api holds `break: 100`
and the web holds `break: 90` with `lib/**` fully killed.

| App | Mutation score | Killed | Survived | Ignored | Result       |
| --- | -------------- | ------ | -------- | ------- | ------------ |
| api | _pending_      |        |          |         | _pending_    |
| web | _pending_      |        |          |         | _pending_    |

## Proven-equivalent mutants (ignored with a reason)

Every row here has a matching `// Stryker disable next-line <Mutator>: <reason>` at the cited
source location. A mutant a test could kill is never listed here.

| Location | Mutator(s) | Reason |
| -------- | ---------- | ------ |
| _pending_ | | |
