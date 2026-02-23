const { defineConfig } = require('cypress');

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  screenshotsFolder: '../../gui_test_screenshots/cypress/screenshots',
  videosFolder: '../../gui_test_screenshots/cypress/videos',
  video: true,
  reporter: '../../node_modules/cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  fixturesFolder: 'fixtures',
  defaultCommandTimeout: 30000,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    setupNodeEvents(on, config) {
      // eslint-disable-next-line global-require
      return require('./plugins/index.js')(on, config);
    },
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'support/index.ts',
    baseUrl: 'http://localhost:9000',
    testIsolation: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 5,
    injectDocumentDomain: true,
    userAgent: 'ConsoleIntegrationTestEnvironment',
  },
  /**
   * @see https://docs.cypress.io/app/references/experiments#Strip-Minimum-CSP-Directives
   */
  experimentalCspAllowList: [
    'script-src-elem',
    'script-src',
    'default-src',
    'form-action',
    'child-src',
    'frame-src',
  ],
});
