const { defineConfig } = require('./cypress-common-config');

module.exports = defineConfig({
  fixturesFolder: 'fixtures',
  e2e: {
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'support/index.ts',
  },
});
