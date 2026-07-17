export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['repo', 'api', 'web', 'ci', 'docs', 'deps']],
  },
}
