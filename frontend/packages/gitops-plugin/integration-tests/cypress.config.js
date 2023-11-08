const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: 'j4jxoy',
  viewportWidth: 1920,
  viewportHeight: 1080,
  defaultCommandTimeout: 40000,
  execTimeout: 90000,
  pageLoadTimeout: 90000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  animationDistanceThreshold: 20,
  screenshotsFolder: '../../../gui_test_screenshots/cypress/screenshots',
  videosFolder: '../../../gui_test_screenshots/cypress/videos',
  video: true,
  reporter: '../../node_modules/cypress-multi-reporters',

  reporterOptions: {
    configFile: 'reporter-config.json',
  },

  fixturesFolder: 'testData',

  retries: {
    runMode: 1,
    openMode: 0,
  },

  env: {
    TAGS: '@gitOps and @smoke and not (@manual or @to-do or @un-verified)',
    NAMESPACE: 'aut-gitops',
  },

  e2e: {
    // TODO: see https://issues.redhat.com/browse/CONSOLE-3781
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // eslint-disable-next-line global-require
      return require('../../dev-console/integration-tests/plugins/index.js')(on, config);
    },
    specPattern: '**/*.{feature,features}',
    supportFile: 'support/commands/index.ts',
    baseUrl: 'http://localhost:9000',
    testIsolation: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 25,
  },
});
