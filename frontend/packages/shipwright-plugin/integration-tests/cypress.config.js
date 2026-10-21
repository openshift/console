const { defineConfig } = require('@console/cypress-integration-tests/cypress-common-config');

module.exports = defineConfig({
  fixturesFolder: 'testData',
  env: {
    TAGS: '(@smoke or @regression) and not (@manual or @to-do or @un-verified or @broken-test)',
    NAMESPACE: 'aut-shipwright',
  },
  e2e: {
    specPattern: 'features/**/*.{feature,features}',
    supportFile: 'support/commands/index.ts',
  },
});
