// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const wp = require('@cypress/webpack-preprocessor');

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
  return config;
};
