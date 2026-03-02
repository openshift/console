import { consoleLogger, PluginStore } from '@openshift/dynamic-plugin-sdk';
import { getSharedScope } from '@console/dynamic-plugin-sdk/src/runtime/plugin-shared-modules';
import type { LocalPluginManifest } from '@openshift/dynamic-plugin-sdk';
import type { Middleware } from 'redux';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import type { RootState } from './redux';
import { valid as semver } from 'semver';
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import { REMOTE_ENTRY_CALLBACK } from '@console/dynamic-plugin-sdk/src/constants';
import { noop } from 'lodash';
import { initConsolePlugins } from '@console/dynamic-plugin-sdk/src/runtime/plugin-init';

/**
 * Set by `console-operator` or `./bin/bridge -release-version`. If this is
 * `unknown`, we will not check this value when loading plugins.
 */
const CURRENT_OPENSHIFT_VERSION = semver(window.SERVER_FLAGS.releaseVersion) ?? 'unknown';

/**
 * Console local plugins module has its source generated during webpack build,
 * so we use dynamic require() instead of the usual static import statement.
 */
const localPlugins: LocalPluginManifest[] = require('../get-local-plugins').default;

// Suppress plugin SDK consoleLogger.info during testing to reduce noise
// TODO: remove when upgrading to SDK 8.1 (codename "Blue")
if (process.env.NODE_ENV === 'test') {
  consoleLogger.info = noop;
}

const localPluginNames = localPlugins.map((p) => p.name);

/** Checks if a plugin name is allowed to be loaded in Console. */
const isAllowedPluginName = (name: string) => {
  return localPluginNames.includes(name) || dynamicPluginNames.includes(name);
};

/**
 * Provides access to Console plugins and their extensions.
 *
 * Plugins listed via {@link dynamicPluginNames} are loaded dynamically at runtime.
 *
 * In development, this object is exposed as `window.pluginStore` for easier debugging.
 */
export const pluginStore = new PluginStore({
  loaderOptions: {
    // Prevent plugins from loading other plugins
    canLoadPlugin: (manifest) => isAllowedPluginName(manifest.name),

    // Explicitly define the default entry callback name
    entryCallbackSettings: {
      name: REMOTE_ENTRY_CALLBACK,
      registerCallback: true,
    },

    // Use coFetch for plugin resource fetching
    fetchImpl: consoleFetch,

    // Allows plugins to target a specific version of OpenShift via semver
    customDependencyResolutions: {
      '@console/pluginAPI': CURRENT_OPENSHIFT_VERSION,
    },

    // Only resolve dependencies that are known to Console
    isDependencyResolvable: (name, isOptional) => {
      // Console operator explicitly sets a known OpenShift version. In development
      // builds this may not be set, but we still want to load plugins. Thus, we
      // skip resolution checks of @console/pluginAPI if the version is 'unknown'.
      if (name === '@console/pluginAPI') {
        return CURRENT_OPENSHIFT_VERSION !== 'unknown';
      }

      // In cases where dependencies are not optional, we must enforce that all
      // plugins are resolvable, i.e., never skip trying to resolve them.

      // When resolving plugin optional dependencies, if we know that an
      // optionalDependency will never be loaded (per isAllowedPluginName), then
      // we should bypass its resolution, so that the plugin can still load
      // even if the optional dependency is not present.
      return !isOptional || isAllowedPluginName(name);
    },

    // Assume that webpack shared scope is already initialized
    sharedScope: getSharedScope(),

    // Additional validation for Console plugin manifests
    transformPluginManifest: (manifest) => {
      // Local plugins can skip remote plugin validation
      if (localPluginNames.includes(manifest.name)) {
        return manifest;
      }

      const result = new ValidationResult('Console plugin metadata');

      // Ensure plugin name can be a valid DNS subdomain name for loading
      result.assertions.validDNSSubdomainName(manifest.name, 'metadata.name');

      // Only allow 'callback' registration method
      result.assertions.validRegistrationMethod(manifest.registrationMethod);

      result.report();

      // No issues, return manifest as-is
      return manifest;
    },

    // Double check that only 'callback' registration method is used
    getPluginEntryModule: ({ name }) => {
      throw new Error(
        `Plugin "${name}" tried to load with registrationMethod "custom", but only "callback" is supported.`,
      );
    },
  },
});

localPlugins.forEach((plugin) => pluginStore.loadPlugin(plugin));

initConsolePlugins(pluginStore);

/** Redux middleware that updates PluginStore FeatureFlags when redux actions are dispatched. */
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
  console.info(`Static plugins: [${localPluginNames.join(', ')}]`);
  // eslint-disable-next-line no-console
  console.info(`Dynamic plugins: [${dynamicPluginNames.join(', ')}]`);
}
