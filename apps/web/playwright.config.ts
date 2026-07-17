/**
 * @fileoverview Playwright configuration for the web smoke.
 *
 * Self-contained (mirrors the nest-cache-example pattern): the `webServer`
 * entries bring the whole stack up before the smoke runs and gate each one
 * on its readiness URL:
 *   1. the API entry builds and starts `apps/api` (`node dist/main.js`),
 *      gated on the bare `GET /health` CI-probe route (never the library's
 *      own `/health/live`/`/health/ready`, which depend on indicator
 *      state). Build-then-start, not `nest start --watch`: Nest's watch
 *      mode runs the compiled entry through a child-process manager that
 *      does not preserve the `process.argv[1]` identity `main.ts`'s
 *      `runIfMain` seam checks, so the app compiles but never actually
 *      listens under watch mode;
 *   2. the web entry builds and starts the dashboard (`next build` then
 *      `next start`) with `NEXT_PUBLIC_API_URL` pointed at the API entry:
 *      Next.js inlines `NEXT_PUBLIC_*` at build time, so it must be set
 *      before `next build`, not only before `next start`.
 * `reuseExistingServer` reattaches to anything already up, so the shared
 * CI pipeline's pre-booted, production-built servers (see
 * `.github/workflows/ci.yml`'s `e2e-web` job) are reused instead of
 * double-started; a local run with nothing listening builds and starts the
 * same production servers itself. No external infra: this app needs no
 * database, cache, or queue.
 *
 * Override the target with `PLAYWRIGHT_BASE_URL` / `PLAYWRIGHT_API_URL` to
 * point the smoke at an already-running stack on non-default ports.
 *
 * @module playwright.config
 */
import { fileURLToPath } from 'node:url'

import { defineConfig, devices } from '@playwright/test'

/** Local stack origins. */
const WEB_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3001'

/** Repo root: the `pnpm --filter` commands resolve workspaces from here. */
const ROOT = fileURLToPath(new URL('../../', import.meta.url))

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['line']],
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
  },
  // Every service the smoke depends on, each gated on its readiness URL.
  // `cwd: ROOT` runs the `pnpm --filter` commands from the repo root.
  webServer: [
    {
      command: 'pnpm --filter api run build && pnpm --filter api run start',
      url: `${API_URL}/health`,
      cwd: ROOT,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `NEXT_PUBLIC_API_URL=${API_URL} pnpm --filter web run build && pnpm --filter web run start`,
      url: WEB_URL,
      cwd: ROOT,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
