const fs = require('fs');
const path = require('path');
const webpack = require('@cypress/webpack-preprocessor');
const { defineConfig } = require('cypress');
const merge = require('lodash/merge');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const webpackPreprocessor = webpack({
  webpackOptions: {
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      fallback: {
        fs: false,
        child_process: false,
        readline: false,
      },
    },
    plugins: [
      new NodePolyfillPlugin({
        additionalAliases: ['process'],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'esbuild-loader',
        },
        {
          test: /\.feature$/,
          use: [
            {
              loader: 'cypress-cucumber-preprocessor/loader',
            },
          ],
        },
        {
          test: /\.features$/,
          use: [
            {
              loader: 'cypress-cucumber-preprocessor/lib/featuresLoader',
            },
          ],
        },
      ],
    },
  },
});

/** @type {Cypress.ResolvedConfigOptions['setupNodeEvents']} */
function setupNodeEvents(on, config) {
  // `on` is used to hook into various events Cypress emits
  on('task', {
    log(message) {
      // eslint-disable-next-line no-console
      console.log(message);
      return null;
    },
    logError(message) {
      // eslint-disable-next-line no-console
      console.error(message);
      return null;
    },
    logTable(data) {
      // eslint-disable-next-line no-console
      console.table(data);
      return null;
    },
    readFileIfExists(filename) {
      if (fs.existsSync(filename)) {
        return fs.readFileSync(filename, 'utf8');
      }
      return null;
    },
  });
  on('after:screenshot', (details) => {
    // Prepend "1_", "2_", etc. to screenshot filenames because they are sorted
    // alphanumerically in CI's artifacts dir
    const pathObj = path.parse(details.path);
    fs.readdir(pathObj.dir, (error, files) => {
      const newPath = `${pathObj.dir}${path.sep}${files.length}_${pathObj.base}`;
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line consistent-return
        fs.rename(details.path, newPath, (err) => {
          if (err) return reject(err);
          // because we renamed and moved the image, resolve with the new path
          // so it is accurate in the test results
          resolve({ path: newPath });
        });
      });
    });
  });
  on('file:preprocessor', webpackPreprocessor);
  /* In a Docker container, the default size of the /dev/shm shared memory space is 64MB.
   * This is not typically enough to run Chrome and can cause the browser to crash. You can
   * fix this by passing the --disable-dev-shm-usage flag to Chrome. */
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.family === 'chromium' && browser.name !== 'electron') {
      launchOptions.args.push('--disable-dev-shm-usage');
    }
    return launchOptions;
  });
  return config;
}

/** @type {Cypress.ConfigOptions} */
const commonConfig = {
  projectId: 'yfeyv6',
  viewportWidth: 1920,
  viewportHeight: 1080,
  defaultCommandTimeout: 40000,
  animationDistanceThreshold: 40,
  execTimeout: 270000,
  pageLoadTimeout: 100000,
  requestTimeout: 15000,
  responseTimeout: 15000,
  // blocked on https://github.com/badeball/cypress-cucumber-preprocessor/issues/1340
  allowCypressEnv: true,
  chromeWebSecurity: true,
  watchForFileChanges: true,
  waitForAnimations: true,
  video: true,
  reporter: path.resolve(__dirname, '../../node_modules/cypress-multi-reporters'),
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  screenshotsFolder: path.resolve(__dirname, '../../gui_test_screenshots/cypress/screenshots'),
  videosFolder: path.resolve(__dirname, '../../gui_test_screenshots/cypress/videos'),
  retries: {
    runMode: 1,
    openMode: 0,
  },

  env: {
    BRIDGE_HTPASSWD_PASSWORD: process.env.BRIDGE_HTPASSWD_PASSWORD,
    BRIDGE_KUBEADMIN_PASSWORD: process.env.BRIDGE_KUBEADMIN_PASSWORD,
  },

  expose: {
    BRIDGE_HTPASSWD_IDP: process.env.BRIDGE_HTPASSWD_IDP,
    BRIDGE_HTPASSWD_USERNAME: process.env.BRIDGE_HTPASSWD_USERNAME,
    OAUTH_BASE_ADDRESS: process.env.OAUTH_BASE_ADDRESS,
    OPENSHIFT_CI: process.env.OPENSHIFT_CI,
    BRIDGE_AWS: process.env.BRIDGE_AWS,
  },

  /**
   * CSP directives to be preserved during Cypress test runs.
   *
   * Note that Cypress only supports a small subset of all standard CSP directives.
   * Therefore, CSP violation testing via Cypress is limited but still useful to have.
   *
   * @see {@link Cypress.ConfigOptions.experimentalCspAllowList}
   * @see https://docs.cypress.io/app/references/experiments#Experimental-CSP-Allow-List
   */
  experimentalCspAllowList: [
    'child-src',
    'default-src',
    'form-action',
    'frame-src',
    'script-src-elem',
    'script-src',
  ],

  e2e: {
    setupNodeEvents,
    baseUrl: `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}${(
      process.env.BRIDGE_BASE_PATH || '/'
    ).replace(/\/$/, '')}`,
    testIsolation: false,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 50,
    injectDocumentDomain: true,
    userAgent: 'ConsoleIntegrationTestEnvironment',
  },
};

/**
 * Configures Cypress with the common configuration and any overrides
 * provided by the caller.
 *
 * @param {Cypress.ConfigOptions} overrides - the config that will be deep-merged with Console-wide defaults
 *
 * @returns {Cypress.ConfigOptions} the merged Cypress configuration
 */
module.exports.defineConfig = (overrides) => defineConfig(merge({}, commonConfig, overrides));
