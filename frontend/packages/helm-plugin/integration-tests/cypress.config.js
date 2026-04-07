const { defineConfig } = require('@console/cypress-integration-tests/cypress-common-config');

module.exports = defineConfig({
  fixturesFolder: 'testData',
  env: {
    TAGS:
      '@helm and (@pre-condition or @smoke or @regression) and not (@manual or @to-do or @broken-test)',
    NAMESPACE: 'aut-helm',
  },
  e2e: {
    specPattern: 'features/**/*.{feature,features}',
    supportFile: 'support/commands/index.ts',
  },
});
