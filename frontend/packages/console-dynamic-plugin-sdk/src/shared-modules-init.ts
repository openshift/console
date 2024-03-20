/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */

import { SharedModuleNames } from './shared-modules';
import { RemoteEntryModule } from './types';

type SharedScopeObject = {
  [moduleName: string]: {
    [versionRange: string]: {
      get: () => Promise<() => any>;
      eager?: boolean;
      loaded?: 1;
    };
  };
};

const initSharedScope = () => {
  const scope: SharedScopeObject = {};

  // If version range is '*' it means "this shared module matches all requested versions",
  // i.e. make sure that the plugin always uses the given shared module implementation
  const addModule = (
    moduleName: SharedModuleNames,
    getModule: () => Promise<() => any>,
    versionRange = '*',
  ) => {
    scope[moduleName] = scope[moduleName] ?? {};
    scope[moduleName][versionRange] = { get: getModule, eager: true, loaded: 1 };
  };

  // Singleton modules provided by Console application without plugin provided fallback
  addModule('@openshift-console/dynamic-plugin-sdk', async () => () =>
    require('@console/dynamic-plugin-sdk/src/lib-core'),
  );
  addModule('@openshift-console/dynamic-plugin-sdk-internal', async () => () =>
    require('@console/dynamic-plugin-sdk/src/lib-internal'),
  );
  addModule('react', async () => () => require('react'));
  addModule('react-i18next', async () => () => require('react-i18next'));
  addModule('react-router', async () => () => require('react-router'));
  addModule('react-router-dom', async () => () => require('react-router-dom'));
  addModule('react-router-dom-v5-compat', async () => () => require('react-router-dom-v5-compat'));
  addModule('react-redux', async () => () => require('react-redux'));
  addModule('redux', async () => () => require('redux'));
  addModule('redux-thunk', async () => () => require('redux-thunk'));

  // Backwards compatibility: provide PatternFly 4 packages for existing Console plugins
  addModule(
    '@patternfly/react-core',
    async () => () => require('@patternfly-4/react-core'),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@patternfly-4/react-core/package.json').version,
  );
  addModule(
    '@patternfly/react-table',
    async () => () => require('@patternfly-4/react-table'),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@patternfly-4/react-table/package.json').version,
  );
  addModule(
    '@patternfly/quickstarts',
    async () => () => require('@patternfly-4/quickstarts'),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@patternfly-4/quickstarts/package.json').version,
  );

  return scope;
};

const sharedScope = initSharedScope();

if (process.env.NODE_ENV !== 'production') {
  // Expose webpack shared scope object for debugging
  window.webpackSharedScope = sharedScope;
}

/**
 * At runtime, the Console application will initialize shared modules for each
 * dynamic plugin before loading any of the modules exposed by the given plugin.
 *
 * Note: `__webpack_init_sharing__` global function is available in webpack 5+ builds.
 * Once Console gets built with webpack 5, evaluate if we need this global in order to
 * allow plugins to attempt to provide shared modules into the application shared scope.
 *
 * @see https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers
 */
export const initSharedPluginModules = (entryModule: RemoteEntryModule) => {
  entryModule.init(sharedScope);
};
