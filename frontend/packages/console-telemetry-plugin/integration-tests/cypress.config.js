const { defineConfig } = require('cypress');

module.exports = defineConfig({
  defaultCommandTimeout: 40000,
  viewportWidth: 1920,
  viewportHeight: 1080,
  animationDistanceThreshold: 20,
  execTimeout: 90000,
  pageLoadTimeout: 90000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  fixturesFolder: 'testData',
  reporter: '../../../node_modules/cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  screenshotsFolder: '../../../gui_test_screenshots/cypress/screenshots',
  videosFolder: '../../../gui_test_screenshots/cypress/videos',
  env: {
    TAGS:
      '(@telemetry or @customize-telemetry) and (@smoke or @regression or @pre-condition) and not (@manual or @to-do or @un-verified or @broken-test)',
    NAMESPACE: 'aut-telemetry',
  },
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // eslint-disable-next-line global-require
      return require('./../../dev-console/integration-tests/plugins/index.js')(on, config);
    },
    specPattern: 'features/**/*.{feature,features}',
    supportFile: 'support/commands/index.ts',
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
