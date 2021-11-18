/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */

import { SharedModuleResolution, RemoteEntryModule } from './types';

const modules: SharedModuleResolution = {
  '@openshift-console/dynamic-plugin-sdk': async () => () =>
    require('@console/dynamic-plugin-sdk/src/lib-core'),
  '@openshift-console/dynamic-plugin-sdk-internal': async () => () =>
    require('@console/dynamic-plugin-sdk/src/lib-internal'),
  '@openshift-console/dynamic-plugin-sdk-internal-kubevirt': async () => () =>
    require('@console/dynamic-plugin-sdk/src/lib-internal-kubevirt'),
  '@openshift-console/dynamic-plugin-sdk-host-app': async () => () =>
    require('@console/dynamic-plugin-sdk/src/lib-host-app'),
  '@patternfly/react-core': async () => () => require('@patternfly/react-core'),
  '@patternfly/react-table': async () => () => require('@patternfly/react-table'),
  react: async () => () => require('react'),
  'react-helmet': async () => () => require('react-helmet'),
  'react-i18next': async () => () => require('react-i18next'),
  'react-router': async () => () => require('react-router'),
  'react-router-dom': async () => () => require('react-router-dom'),
  'react-redux': async () => () => require('react-redux'),
  redux: async () => () => require('redux'),
  'redux-thunk': async () => () => require('redux-thunk'),
};

const sharedScope = Object.keys(modules).reduce(
  (acc, moduleRequest) => ({
    ...acc,
    [moduleRequest]: {
      // The '*' semver range means "this shared module matches all requested versions",
      // i.e. make sure the plugin always uses the Console-provided shared module version
      '*': {
        get: modules[moduleRequest],
        // Indicates that Console has already loaded the shared module
        loaded: true,
      },
    },
  }),
  {},
);

/**
 * At runtime, the Console application will initialize shared modules for each
 * dynamic plugin before loading any of the modules exposed by the given plugin.
 *
 * Currently, module sharing is strictly unidirectional (Console -> plugins).
 *
 * Note: `__webpack_init_sharing__` global function is available in webpack 5+ builds.
 * Once Console gets built with webpack 5, evaluate if we need this global in order to
 * allow plugins to attempt to provide shared modules into the application shared scope.
 *
 * @see https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers
 */
export const initSharedPluginModules = (entryModule: RemoteEntryModule) => {
  if (typeof entryModule.override === 'function') {
    // Support plugins built with webpack 5.0.0-beta.16
    entryModule.override(modules);
    return;
  }

  entryModule.init(sharedScope);
};
