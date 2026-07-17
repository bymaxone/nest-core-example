# Contributing to nest-core-example

Thanks for your interest. This repository is the canonical reference application for
`@bymax-one/nest-core`, so contributions are judged by how well they demonstrate the library,
not by generic code churn.

## Reporting security issues

Please do not open a public issue for a vulnerability. Contact the maintainers privately at
**support@bymax.one** with a description of the issue and, if possible, a reproduction.

## The bar for a change

> _"Does this make the demonstration of `@bymax-one/nest-core` clearer or more complete?"_

Changes that clarify a library feature, add a missing demonstration, fix a bug, or improve the
docs are welcome. Generic refactors that obscure how the library is wired will be declined.

## Prerequisites

- Node.js >= 24 and pnpm (`corepack enable`).

## Getting started

```bash
git clone https://github.com/bymaxone/nest-core-example.git
cd nest-core-example
pnpm install
```

## Verification, run before every PR

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
```

## Commits, Conventional Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): subject`, enforced locally by commitlint. Use the scopes in `.gitmessage`
(`repo` · `api` · `web` · `ci` · `docs` · `deps`). Do not add any AI-attribution or
`Co-Authored-By` trailer.

## Pull requests

- No suppression comments (`@ts-ignore`, `eslint-disable`); fix the root cause instead.
- No Swagger, controllers are documented with JSDoc and DTOs are Zod schemas.
- English only; never bypass the pre-commit or commit-msg hooks (`--no-verify` is prohibited).
- CI must be green (install, lint, typecheck, build, test).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
