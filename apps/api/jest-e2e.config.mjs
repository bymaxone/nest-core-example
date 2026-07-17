/**
 * Jest configuration for the API E2E tier.
 *
 * ESM-native like the unit config: specs and the app source are pure ESM
 * (`"type": "module"`, `NodeNext`), so Jest runs under `node
 * --experimental-vm-modules` and ts-jest transpiles every `.ts` to ESM
 * (`useESM: true`). The `moduleNameMapper` rewrites the explicit `.js` import
 * specifiers the source uses (NodeNext requires them) back to the on-disk
 * `.ts` files Jest resolves.
 *
 * Every spec boots the real, in-process `createApp()` (or, for the
 * configuration-variant suites, a dedicated `BymaxCoreModule.forRoot(...)`
 * testing module) against an ephemeral loopback port, with no external
 * infra and no Testcontainers. `maxWorkers: '50%'` and `runInBand` bound
 * memory: this repo consumes `@bymax-one/nest-core` from a sibling
 * `file:` checkout, and unbounded parallel workers each reload it.
 *
 * @type {import('jest').Config}
 */
export default {
  rootDir: 'test',
  testMatch: ['**/*.e2e-spec.ts'],
  testEnvironment: 'node',
  // The hanging-indicator timeout variant and app-boot overhead exceed Jest's
  // 5s default; give every e2e test headroom without masking a real hang.
  testTimeout: 20_000,
  moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs', 'json'],
  setupFiles: ['reflect-metadata'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  // NodeNext source imports siblings as `./foo.js`; map the `.js` specifier back to
  // the `.ts` source so Jest resolves the file it actually transpiles.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: '50%',
}
