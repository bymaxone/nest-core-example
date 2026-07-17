# CLAUDE.md, nest-core-example

Reference application demonstrating every public export of `@bymax-one/nest-core`, a NestJS 11
foundation kit.

**Stack:** NestJS 11 (`apps/api`) · Next.js 16 (`apps/web`) · `@bymax-one/nest-core`

See `docs/` for full details:

- `TECHNICAL_SPECIFICATION.md`, architecture, API contracts, feature matrix
- `DEVELOPMENT_PLAN.md`, phased roadmap with conventions
- `tasks/README.md`, per-phase task index

## Non-negotiables

- **English only**, all identifiers, comments, JSDoc, commit messages.
- **Conventional Commits**, enforced by `commitlint` + husky `commit-msg` hook.
- **No Swagger**, controllers are documented with JSDoc; DTOs are Zod schemas.
- **No `@ts-ignore` / `eslint-disable`**, fix the root cause instead.
- **No `--no-verify`**, never bypass the pre-commit or commit-msg hooks.
