const crypto = require('crypto');
const { defineConfig } = require('cypress');
// A workaround fix for the breaking change in Node.js v18 due to the change in hashing algorithm.
// This code change override the default webpack v4 default hashing algorithm -"md4".
// This change can be remove when console UI update webpack to version 5 in the future.
const hash = crypto.createHash;

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
      Object.assign(crypto, {
        createHash: () => hash('sha256'),
      });
      // eslint-disable-next-line global-require
      return require('../../dev-console/integration-tests/plugins/index.js')(on, config);
    },
    specPattern: '**/*.{feature,features}',
    supportFile: 'support/commands/index.ts',
    baseUrl: 'http://localhost:9000',
    testIsolation: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 5,
  },
});
