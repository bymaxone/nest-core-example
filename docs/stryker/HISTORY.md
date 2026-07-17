# Stryker Mutation History

Append-only log of mutation runs (newest at the bottom of each app's table). Scores are the
percentage of detected mutants over valid (non-ignored) mutants.

## api (break: 100)

| Date       | Score   | Killed | Survived | Timeout | Ignored | Note                                          |
| ---------- | ------- | ------ | -------- | ------- | ------- | --------------------------------------------- |
| 2026-07-17 | 77.81%  | 239    | 69       | 3       | 48      | Baseline (pre-hardening).                     |
| 2026-07-17 | 100.00% | 284    | 0        | 4       | 53      | After hardening: 0 survivors; 9 equivalents documented. |

## web (break: 90)

| Date       | Score  | Killed | Survived | Ignored | Note                                                       |
| ---------- | ------ | ------ | -------- | ------- | ---------------------------------------------------------- |
| 2026-07-17 | 84.22% | 555    | 104      | 41      | Baseline (pre-hardening).                                  |
| 2026-07-17 | 90.72% | 596    | 61       | 43      | After hardening: `lib/**` at 100 (0 survivors); passes break 90. |
