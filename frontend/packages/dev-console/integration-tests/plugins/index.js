const wp = require('@cypress/webpack-preprocessor');
const cucumber = require('cypress-cucumber-preprocessor').default;

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
  });
  // on('file:preprocessor', wp(options));
  // on('file:preprocessor', cucumber());

  on('file:preprocessor', (file) => {
    if (file.filePath.match(/\.(js|jsx|ts)/g)) {
      return wp(options)(file);
    }
    return cucumber()(file);
  });

  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  config.baseUrl = `${process.env.BRIDGE_BASE_ADDRESS ||
    'https://console-openshift-console.apps.sgoodwin.devcluster.openshift.com'}${(
    process.env.BRIDGE_BASE_PATH || '/'
  ).replace(/\/$/, '')}`;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  config.env.BRIDGE_KUBEADMIN_IDP = process.env.BRIDGE_KUBEADMIN_IDP;
  return config;
};
