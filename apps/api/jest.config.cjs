'use strict'

/**
 * Jest configuration for the API unit tier.
 *
 * ts-jest transpiles the ESM TypeScript sources; `useESM` plus the
 * `--experimental-vm-modules` flag (set in the package `test` script) load them
 * as real ES modules, so `@bymax-one/nest-core` resolves through its packaged
 * `exports` map exactly as Node does for a published consumer. The worker pool
 * is capped at 50% because every worker reloads the locally packed
 * `@bymax-one/nest-core` (`file:` dependency) plus its own ts-jest transpiler,
 * so an unbounded pool multiplies that footprint and can exhaust memory.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/../tsconfig.json',
      },
    ],
  },
  // NodeNext sources import siblings with a `.js` specifier; map it back to the
  // `.ts` file Jest actually transpiles.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.d.ts'],
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
  coverageReporters: ['text', 'text-summary'],
  coverageDirectory: '../coverage/api',
  clearMocks: true,
  restoreMocks: true,
  testEnvironment: 'node',
  maxWorkers: '50%',
}
