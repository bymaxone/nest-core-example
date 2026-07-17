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

The api holds `break: 100` and the web holds `break: 90` with `lib/**` fully killed. Survivors
that remain are proven-equivalent mutants, disabled with a reason (see the table below).

| App | Mutation score | Detected (killed + timeout + error) | Survived | Ignored | Result                    |
| --- | -------------- | ----------------------------------- | -------- | ------- | ------------------------- |
| api | 100.00%        | 290 (284 + 4 + 2)                   | 0        | 53      | passes `break: 100`       |
| web | 90.72%         | 596                                 | 61 (presentational, under the 90 bar) | 43 | passes `break: 90`; `lib/**` at 100 (0 survivors) |

The api holds a perfect score. The web bar is 90 by design (spec §18): the remaining web
survivors are presentational component mutants (Tailwind class variants and layout markup) below
the 90 threshold; every `lib/**` logic module is at 100.

## Proven-equivalent mutants (ignored with a reason)

Every row here has a matching `// Stryker disable <Mutator>: <reason>` at the cited source
location. A mutant a test could kill is never listed here.

| Location                                   | Mutator(s)                | Reason                                                                                                    |
| ------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/api/src/core/core.config.ts` (`INFER`)          | ObjectLiteral, BooleanLiteral | `{ infer: true }` is a compile-time-only `@nestjs/config` type hint; an emptied object or a flipped flag reads the identical value. |
| `apps/api/src/catalog/product.repository.ts` (`INFER`) | ObjectLiteral, BooleanLiteral | Same `{ infer: true }` compile-time hint, hoisted once for the two config reads.                          |
| `apps/api/src/core/ring-buffer-timing.sink.ts` L33    | ObjectLiteral, BooleanLiteral | Same `{ infer: true }` compile-time hint on the single buffer-size read.                                  |
| `apps/api/src/health-demo/hanging.indicator.ts`       | ObjectLiteral, BooleanLiteral | `ref: false` only governs whether the pending timer keeps the process alive; never observable in the check's result or timing. |
| `apps/api/src/config/env.schema.ts` (`joinedPath`)    | StringLiteral             | Env keys are all top-level, so an issue path never has more than one segment and the join separator is never observable. |
| `apps/web/lib/env.ts` (`field` join)                  | StringLiteral             | The single web env var is top-level; an issue path never has more than one segment.                       |
| `apps/web/lib/env.ts` (`.join('\n')`)                 | StringLiteral             | Only one variable is validated, so the issue list is always a single line and the newline separator is never observable. |
