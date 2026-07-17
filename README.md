<p align="center">
  <img src="https://img.shields.io/badge/%40bymax--one-nest--core--example-000000?style=for-the-badge&logo=nestjs&logoColor=E0234E" alt="nest-core-example" />
</p>

<h1 align="center">nest-core-example</h1>

<p align="center">
  <strong>Reference application for <a href="https://github.com/bymaxone/nest-core"><code>@bymax-one/nest-core</code></a></strong><br />
  <sub>NestJS 11 · Next.js 16 · TypeScript strict · Zod · error envelope · pagination · health · metrics</sub>
</p>

<p align="center">
  <a href="https://github.com/bymaxone/nest-core-example/actions/workflows/ci.yml"><img src="https://github.com/bymaxone/nest-core-example/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/bymaxone/nest-core-example/blob/main/LICENSE"><img src="https://img.shields.io/github/license/bymaxone/nest-core-example?style=flat-square&colorA=000000&colorB=000000" alt="license" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript strict" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-24%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 24+" /></a>
</p>

---

## Overview

`@bymax-one/nest-core` is the **what**; this repository is the **how**. It demonstrates every
public export of the library, error envelopes, the timing interceptor, offset and cursor
pagination, the health aggregator, and the metrics endpoint, inside one runnable NestJS 11 API
and a Next.js 16 observability dashboard, so a reader can see the library's behavior instead of
reading it from a README alone.

## Documentation

- [`docs/TECHNICAL_SPECIFICATION.md`](docs/TECHNICAL_SPECIFICATION.md), the authoritative
  architecture and API contract blueprint.
- [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md), the phased execution roadmap and
  conventions.
- [`docs/tasks/README.md`](docs/tasks/README.md), the per-phase task index for implementers.

## Status

This repository is under construction. Phase 0 (repository foundation and CI) is the first
phase to land; the API, the dashboard, and their demonstration domains follow in subsequent
phases. See the [Progress Dashboard](docs/DEVELOPMENT_PLAN.md#progress-dashboard) for the
current state.

## License

[MIT](LICENSE)
