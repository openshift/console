const { defineConfig } = require('@console/cypress-integration-tests/cypress-common-config');

module.exports = defineConfig({
  fixturesFolder: 'testData',
  env: {
    TAGS:
      '(@web-terminal or @customize-web-terminal) and (@smoke or @regression or @pre-condition) and not (@manual or @to-do or @un-verified or @broken-test)',
    NAMESPACE: 'aut-webterminal',
  },
  e2e: {
    specPattern: 'features/**/*.{feature,features}',
    supportFile: 'support/commands/index.ts',
  },
});
