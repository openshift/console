/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const webpack = require('@cypress/webpack-preprocessor');
const util = require('../reporters/utils/parallel-thread-logger');

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.ts', '.tsx', '.js'],
      },
      node: {
        fs: 'empty',
        child_process: 'empty',
        readline: 'empty',
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
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
  };
  // `on` is used to hook into various events Cypress emits
  on('task', {
    log(message) {
      console.log(message);
      util.log(`\n\t${message}`);
      return null;
    },
    logError(message) {
      console.error(message);
      util.log(`\n\t${message}\n`);
      return null;
    },
    logTable(data) {
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
  on('after:spec', (spec, results) => {
    if (results) {
      util.logSpecResult(results);
    }

    if (results && results.screenshots.length) {
      util.logScreenshotURL(results.screenshots);
    }

    if (results && results.video) {
      util.logVideoURL(results.video);
    }

    util.log(`\n\n${'─'.repeat(100)}`);
  });
  on('file:preprocessor', webpack(options));
  /* In a Docker container, the default size of the /dev/shm shared memory space is 64MB. This is not typically enough
   to run Chrome and can cause the browser to crash. You can fix this by passing the --disable-dev-shm-usage flag to
   Chrome with the following workaround: */
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.family === 'chromium' && browser.name !== 'electron') {
      launchOptions.args.push('--disable-dev-shm-usage');
    }
    return launchOptions;
  });
  // `config` is the resolved Cypress config
  config.baseUrl = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}${(
    process.env.BRIDGE_BASE_PATH || '/'
  ).replace(/\/$/, '')}`;
  config.env.BRIDGE_HTPASSWD_IDP = process.env.BRIDGE_HTPASSWD_IDP;
  config.env.BRIDGE_HTPASSWD_USERNAME = process.env.BRIDGE_HTPASSWD_USERNAME;
  config.env.BRIDGE_HTPASSWD_PASSWORD = process.env.BRIDGE_HTPASSWD_PASSWORD;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  config.env.OAUTH_BASE_ADDRESS = process.env.OAUTH_BASE_ADDRESS;
  return config;
};
