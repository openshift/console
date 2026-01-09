import type { PluginStore } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash';
import type { Store } from 'redux';
import {
  initSharedScope,
  getSharedScope,
} from '@console/dynamic-plugin-sdk/src/runtime/plugin-shared-modules';
import type { RootState } from '@console/internal/redux';
import { initSubscriptionService } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import type { ConsoleSupportedCustomProperties } from '../build-types';
import type { ErrorWithCause } from '../utils/error/custom-error';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import { resolveURL } from '../utils/url';

/**
 * Calls {@link PluginStore.loadPlugin} for the given plugin name, and
 * checks if the plugin was loaded successfully.
 *
 * Our `PluginStore` is configured to automatically enable loaded plugins.
 */
const loadAndEnablePlugin = async (
  pluginName: string,
  pluginStore: PluginStore,
  onError: (errorMessage: string, errorCause?: unknown) => void = _.noop,
) => {
  await pluginStore
    .loadPlugin(
      resolveURL(
        `${window.SERVER_FLAGS.basePath}api/plugins/${pluginName}/`,
        'plugin-manifest.json',
      ),
    )
    .catch((err: ErrorWithCause) => {
      // ErrorWithCause isn't the exact type but it's close enough for our use
      onError(`[loadAndEnablePlugin] ${pluginName} loading failed: ${err.message}`, err.cause);
    });

  const plugin = pluginStore.getPluginInfo().find((p) => p.manifest.name === pluginName);

  if (plugin?.status === 'failed') {
    onError(
      `[loadAndEnablePlugin] ${pluginName} loading failed: ${plugin.errorMessage}`,
      plugin.errorCause,
    );
  } else if (plugin?.status === 'loaded') {
    const disablePlugins = (
      (plugin.manifest.customProperties?.console as ConsoleSupportedCustomProperties)
        ?.disableStaticPlugins ?? []
    ).filter((name) => {
      const pluginInfo = pluginStore.getPluginInfo().find((p) => p.manifest.name === name);

      // Ensure dynamic plugins cannot disable other dynamic plugins
      return pluginInfo?.manifest.registrationMethod === 'local';
    });

    if (disablePlugins.length > 0) {
      pluginStore.disablePlugins(disablePlugins, `disableStaticPlugins in ${pluginName}`);
    }
  }
};

/**
 * Registers a polyfill for the legacy plugin entry callback function.
 *
 * In previous versions of console (4.21 and older), `DynamicRemotePlugin` included
 * the version in the plugin ID (e.g., "my-plugin@1.0.0"). Starting from 4.22,
 * we aligned `ConsoleRemotePlugin` with `DynamicRemotePlugin`, so only the plugin name
 * is used as the ID (e.g., "my-plugin").
 *
 * We also aligned the name of the global callback function used by `PluginLoader`
 * to the default option used by `DynamicRemotePlugin` to reflect this change.
 *
 * Plugins built with the new callback function do not need this shim.
 */
const registerLegacyPluginEntryCallback = () => {
  /** DEFAULT_REMOTE_ENTRY_CALLBACK in @openshift/dynamic-plugin-sdk */
  const sdkCallbackName = '__load_plugin_entry__';
  /** Used in @openshift-console/dynamic-plugin-sdk-webpack 1.0.0 - 4.21.x */
  const previousConsoleCallbackName = 'loadPluginEntry';

  window[previousConsoleCallbackName] = (pluginName: string, entryModule: any) => {
    const patchedPluginName = pluginName.split('@')[0];
    window[sdkCallbackName](patchedPluginName, entryModule);
  };

  // eslint-disable-next-line no-console
  console.info(
    `Legacy plugin entry callback "${previousConsoleCallbackName}" has been registered.`,
  );
};

export const initConsolePlugins = _.once(
  (pluginStore: PluginStore, reduxStore: Store<RootState>) => {
    // Initialize dynamic plugin infrastructure
    initSubscriptionService(pluginStore, reduxStore);
    registerLegacyPluginEntryCallback();

    // Initialize webpack share scope object and start loading plugins
    initSharedScope()
      .then(() => {
        dynamicPluginNames.forEach((pluginName) => {
          loadAndEnablePlugin(pluginName, pluginStore, (errorMessage, errorCause) => {
            // eslint-disable-next-line no-console
            console.error(..._.compact([errorMessage, errorCause]));
          });
        });

        if (process.env.NODE_ENV !== 'production') {
          // Expose webpack share scope object for debugging
          window.webpackSharedScope = getSharedScope();
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize webpack share scope for dynamic plugins', err);
      });
  },
);
