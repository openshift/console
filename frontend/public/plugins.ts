import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { getSharedScope } from '@console/dynamic-plugin-sdk/src/runtime/plugin-shared-modules';
import type { LocalPluginManifest } from '@openshift/dynamic-plugin-sdk';
import type { Middleware } from 'redux';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import type { RootState } from './redux';
import { valid as semver } from 'semver';
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';

/** Set by `console-operator` or `./bin/bridge -release-version` */
const CURRENT_OPENSHIFT_VERSION = semver(window.SERVER_FLAGS.releaseVersion);

/**
 * Console local plugins module has its source generated during webpack build,
 * so we use dynamic require() instead of the usual static import statement.
 */
const localPlugins =
  process.env.NODE_ENV !== 'test'
    ? (require('../get-local-plugins').default as LocalPluginManifest[])
    : [];

const localPluginNames = localPlugins.map((p) => p.name);

/**
 * Provides access to Console plugins and their extensions.
 *
 * Plugins listed via {@link dynamicPluginNames} are loaded dynamically at runtime.
 *
 * In development, this object is exposed as `window.pluginStore` for easier debugging.
 */
export const pluginStore = new PluginStore({
  loaderOptions: {
    sharedScope: getSharedScope(),
    // @ts-expect-error incompatible due to console-specific fetch options
    fetchImpl: consoleFetch,
    // Allows plugins to target a specific version of OpenShift via semver
    fixedPluginDependencyResolutions: {
      // TODO(plugin-sdk): allow a way to bypass this dependency in development, where we don't have this info
      '@console/pluginAPI':
        process.env.NODE_ENV === 'production'
          ? CURRENT_OPENSHIFT_VERSION // this is always provided by console-operator in production
          : CURRENT_OPENSHIFT_VERSION || '4.1337.67',
    },
    // Additional validation for plugin manifest
    transformPluginManifest: (manifest) => {
      const isLocalPlugin = localPluginNames.includes(manifest.name);

      // Local plugins can skip remote plugin validation
      if (isLocalPlugin) {
        return manifest;
      }

      // Only allow plugins listed in `dynamicPluginNames` to be loaded
      if (!dynamicPluginNames.includes(manifest.name)) {
        throw new Error(`Plugin "${manifest.name}" is not in the list of allowed plugins.`);
      }

      // Ensure plugin name can be a valid DNS subdomain name for loading
      const result = new ValidationResult('Console plugin metadata');
      result.assertions.validDNSSubdomainName(manifest.name, 'metadata.name');

      if (result.hasErrors()) {
        throw new Error(result.formatErrors());
      }

      // No issues, return manifest as-is
      return manifest;
    },
  },
});

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
  console.info(`Static plugins: [${localPluginNames.join(', ')}]`);
  // eslint-disable-next-line no-console
  console.info(`Dynamic plugins: [${dynamicPluginNames.join(', ')}]`);
}
