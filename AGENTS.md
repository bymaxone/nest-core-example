# AGENTS.md, nest-core-example

Reference application demonstrating every public export of `@bymax-one/nest-core`, a NestJS 11
foundation kit.

**Stack:** NestJS 11 (`apps/api`) · Next.js 16 (`apps/web`) · `@bymax-one/nest-core`

Read `docs/` first:

- `TECHNICAL_SPECIFICATION.md`, architecture, API contracts, feature matrix
- `DEVELOPMENT_PLAN.md`, phased roadmap, conventions, and quality gates
- `tasks/README.md`, phase index; `tasks/phase-NN-*.md`, the authoritative source for
  in-progress work

## Non-negotiables

- **English only**, all identifiers, comments, JSDoc, and commit messages must be in English.
- **Conventional Commits**, format enforced by commitlint; scopes: `repo | api | web | ci | docs | deps`.
- **No Swagger**, REST contracts are JSDoc on controllers; request and response shapes are Zod
  schemas.
- **No `@ts-ignore` / `eslint-disable` / suppression comments**, fix the root cause.
- **No `--no-verify`**, never skip the pre-commit (lint-staged) or commit-msg (commitlint) hooks.
- **TypeScript strict**, `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`;
  zero `any`.
