const crypto = require('crypto');
const { defineConfig } = require('cypress');
// A workaround fix for the breaking change in Node.js v18 due to the change in hashing algorithm.
// This code change override the default webpack v4 default hashing algorithm -"md4".
// This change can be remove when console UI update webpack to version 5 in the future.
const hash = crypto.createHash;

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
      Object.assign(crypto, {
        createHash: () => hash('sha256'),
      });
      // eslint-disable-next-line global-require
      return require('./plugins/index.js')(on, config);
    },
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'support/index.ts',
    baseUrl: 'http://localhost:9000',
    testIsolation: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 5,
  },
});
