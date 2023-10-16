const { defineConfig } = require('cypress')

module.exports = defineConfig({
  defaultCommandTimeout: 40000,
  viewportWidth: 1920,
  viewportHeight: 1080,
  animationDistanceThreshold: 20,
  execTimeout: 200000,
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
    TAGS: '(@knative or @knative-admin or @knative-camelk or @knative-eventing or @knative-kafka or @knative-serverless) and (@pre-condition or @smoke or @regression) and not (@manual or @to-do or @un-verified or @broken-test)',
    NAMESPACE: 'aut-knative',
  },
  retries: {
    runMode: 0,
    openMode: 0,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./../../dev-console/integration-tests/plugins/index.js')(
        on,
        config
      )
    },
    specPattern: 'features/**/*.{feature,features}',
    supportFile: 'support/commands/index.ts',
    baseUrl: 'http://localhost:9000',
    testIsolation: false,
  },
})
