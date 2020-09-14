// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const wp = require('@cypress/webpack-preprocessor');
const log2output = require('cypress-log-to-output');

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.ts', '.tsx', '.js'],
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            options: { transpileOnly: true },
          },
        ],
      },
    },
  };
  // `on` is used to hook into various events Cypress emits
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    logError(message) {
      console.error(message);
      return null;
    },
    logTable(data) {
      console.table(data);
      return null;
    },
  });
  on('file:preprocessor', wp(options));
  on('before:browser:launch', (browser = {}, launchOptions) => {
    log2output.install(on, (type, event) => {
      // return true or false from this plugin to control if the event is logged
      // `type` is either `console` or `browser`
      // if `type` is `browser`, `event` is an object of the type `LogEntry`:
      //  https://chromedevtools.github.io/devtools-protocol/tot/Log#type-LogEntry
      // if `type` is `console`, `event` is an object of the type passed to `Runtime.consoleAPICalled`:
      //  https://chromedevtools.github.io/devtools-protocol/tot/Runtime#event-consoleAPICalled
      return (
        type === 'console' &&
        event.type === 'log' &&
        event.args[0].value.includes('i18next: languageChanged')
      );
      // return true;
    });
    launchOptions.args = log2output.browserLaunchHandler(browser, launchOptions.args);
    /* In a Docker container, the default size of the /dev/shm shared memory space is 64MB. This is not typically enough
 to run Chrome and can cause the browser to crash. You can fix this by passing the --disable-dev-shm-usage flag to
 Chrome with the following workaround: */
    if (browser.family === 'chromium' && browser.name !== 'electron') {
      launchOptions.args.push('--disable-dev-shm-usage');
      launchOptions.preferences.default.intl = { accept_languages: 'en,en-US' };
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
  return config;
};
