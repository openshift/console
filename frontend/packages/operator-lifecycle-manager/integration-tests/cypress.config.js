const { defineConfig } = require('@console/cypress-integration-tests/cypress-common-config');

module.exports = defineConfig({
  fixturesFolder: 'fixtures',
  e2e: {
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: '../../integration-tests/support/index.ts',
  },
});
