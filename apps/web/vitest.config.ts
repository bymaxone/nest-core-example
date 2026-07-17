/**
 * @fileoverview Vitest configuration for apps/web unit tests.
 *
 * Uses jsdom so React components and browser-side modules (fetch, URL,
 * matchMedia) are available during tests. `test.env` supplies a fixed
 * `NEXT_PUBLIC_API_URL` so `lib/env.ts` validates at import time regardless
 * of the invoking shell's environment (CI's unit-test job does not set this
 * var; only the separate web-build job does). `maxWorkers: '50%'` bounds
 * memory use per the project's test-isolation policy: this repo consumes
 * `@bymax-one/nest-core` from a sibling `file:` checkout, and unbounded
 * parallel workers each reload the consumed module graph.
 *
 * Coverage is scoped to `lib/**` and the bespoke `components/**` modules
 * that carry real logic. Presentational shadcn primitives
 * (`components/ui/**`), the shell chrome (`components/layout/**`), and App
 * Router pages (`app/**`) are exercised by manual verification and the
 * Playwright web smoke landing in a later phase, not by this unit gate.
 *
 * @module vitest.config
 */

import { fileURLToPath } from 'node:url'
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'coverage'],
    maxWorkers: '50%',
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    },
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: [
        'node_modules',
        '.next',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
        'components/ui/**',
        'components/layout/**',
      ],
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        branches: 100,
        lines: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
})
