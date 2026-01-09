import * as _ from 'lodash';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { getSharedScope } from '@console/dynamic-plugin-sdk/src/runtime/plugin-shared-modules';
import type { LocalPluginManifest } from '@openshift/dynamic-plugin-sdk';
import { getURLSearchParams } from './components/utils/link';
import type { Middleware } from 'redux';
import type { RootState } from './redux';
import { valid as semver } from 'semver';
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';

const getEnabledDynamicPluginNames = () => {
  const allPluginNames = window.SERVER_FLAGS.consolePlugins;
  const disabledPlugins = getURLSearchParams()['disable-plugins'];

  if (disabledPlugins === '') {
    return [];
  } else if (!disabledPlugins) {
    return allPluginNames;
  }

  const disabledPluginNames = _.compact(disabledPlugins.split(','));
  return allPluginNames.filter((pluginName) => !disabledPluginNames.includes(pluginName));
};

const dynamicPluginNames = getEnabledDynamicPluginNames();

export const pluginStore = new PluginStore(
  {
    loaderOptions: {
      sharedScope: getSharedScope(),
      fetchImpl: consoleFetch,
      fixedPluginDependencyResolutions: {
        // Allows plugins to target a specific version of OpenShift via semver
        '@console/pluginAPI': semver(window.SERVER_FLAGS.releaseVersion),
      },
    },
  },
  dynamicPluginNames,
);

// Console local plugins module has its source generated during webpack build,
// so we use dynamic require() instead of the usual static import statement.
const localPlugins =
  process.env.NODE_ENV !== 'test'
    ? (require('../get-local-plugins').default as LocalPluginManifest[])
    : [];

localPlugins.forEach((plugin) => pluginStore.loadPlugin(plugin));

/**
 * Redux middleware to update plugin store feature flags when actions are dispatched.
 */
export const featureFlagMiddleware: Middleware<{}, RootState> = (s) => {
  let prevFlags: RootState['FLAGS'] | undefined;

  return (next) => (action) => {
    const result = next(action);
    const nextFlags = s.getState().FLAGS;

    if (nextFlags !== prevFlags) {
      prevFlags = nextFlags;
      pluginStore.setFeatureFlags(nextFlags.toObject());
    }

    return result;
  };
};

if (process.env.NODE_ENV !== 'production') {
  // Expose Console plugin store for debugging
  window.pluginStore = pluginStore;
}

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Static plugins: [${localPlugins.map((p) => p.name).join(', ')}]`);
  // eslint-disable-next-line no-console
  console.info(`Dynamic plugins: [${dynamicPluginNames.join(', ')}]`);
}
