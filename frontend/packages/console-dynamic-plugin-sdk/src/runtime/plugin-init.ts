import type { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { consoleLogger } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash';
import {
  initSharedScope,
  getSharedScope,
  monkeyPatchSharedScope,
} from '@console/dynamic-plugin-sdk/src/runtime/plugin-shared-modules';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import { addTestError } from '@console/shared/src/utils/test-errors';
import { REMOTE_ENTRY_CALLBACK } from '../constants';
import type { ErrorWithCause } from '../utils/error/custom-error';
import { HttpError, TimeoutError } from '../utils/error/http-error';
import { resolveURL } from '../utils/url';

/** Matches the number of attempts used by `coFetch` for RetryError. */
export const PLUGIN_MANIFEST_MAX_ATTEMPTS = 3;

const RETRYABLE_HTTP_STATUS_CODES = new Set([401, 408, 429, 500, 502, 503, 504]);

/**
 * Messages thrown by `fetch` for a failed connection. Other `TypeError`s are
 * code bugs and must not be retried or copied into logs.
 */
const FETCH_TYPE_ERROR_MESSAGES = new Set([
  'Failed to fetch',
  'Load failed',
  'Network request failed',
]);

const isFetchTypeError = (err: TypeError): boolean =>
  FETCH_TYPE_ERROR_MESSAGES.has(err.message) ||
  err.message.startsWith('NetworkError when attempting to fetch resource');

type PluginManifestRetryReason = 'timeout' | 'network' | `status ${number}`;

/**
 * Allowlisted retry reason for a transient manifest fetch failure.
 *
 * A 401 is retryable because Console sessions are stored per pod. The first
 * request after login can land on a replica that does not have the session
 * and return Unauthorized; a later attempt may hit the replica that does.
 *
 * Walks `cause` so SDK `ErrorWithCause` wrappers around `HttpError` still match.
 * The reason is a status code or a static label. It never includes the error
 * message, response, parsed body, or request URL.
 */
const getPluginManifestRetryReason = (err: unknown): PluginManifestRetryReason | undefined => {
  const visited = new Set<unknown>();
  let current: unknown = err;

  while (current != null && !visited.has(current)) {
    visited.add(current);

    if (current instanceof HttpError && RETRYABLE_HTTP_STATUS_CODES.has(current.code ?? 0)) {
      return `status ${current.code}`;
    }

    if (current instanceof TimeoutError) {
      return 'timeout';
    }

    if (current instanceof TypeError && isFetchTypeError(current)) {
      return 'network';
    }

    current =
      typeof current === 'object' && 'cause' in current
        ? (current as { cause: unknown }).cause
        : undefined;
  }

  return undefined;
};

export const isRetryablePluginManifestError = (err: unknown): boolean =>
  getPluginManifestRetryReason(err) !== undefined;

/**
 * Calls {@link PluginStore.loadPlugin} for the given plugin name, and
 * checks if the plugin was loaded successfully.
 *
 * Our `PluginStore` is configured to automatically enable loaded plugins.
 *
 * Manifest fetch failures that look transient (401 from a replica without a
 * session, 5xx, timeouts, network errors) are retried. `PluginStore` does not
 * register the plugin until the manifest is fetched, so a retry is a clean
 * second attempt rather than a reload of a failed plugin.
 */
export const loadAndEnablePlugin = async (
  pluginName: string,
  pluginStore: PluginStore,
  onError: (errorMessage: string, errorCause?: unknown) => void = _.noop,
) => {
  const manifestURL = resolveURL(
    `${window.SERVER_FLAGS.basePath}api/plugins/${pluginName}/`,
    'plugin-manifest.json',
  );

  let lastError: { message: string; cause?: unknown } | undefined;

  for (let attempt = 1; attempt <= PLUGIN_MANIFEST_MAX_ATTEMPTS; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential retries of a single plugin load
      await pluginStore.loadPlugin(manifestURL);
      lastError = undefined;
      break;
    } catch (err) {
      // ErrorWithCause isn't the exact type but it's close enough for our use
      const error = err as ErrorWithCause;
      lastError = { message: error.message, cause: error.cause };

      const retryReason = getPluginManifestRetryReason(error);
      if (!retryReason || attempt === PLUGIN_MANIFEST_MAX_ATTEMPTS) {
        break;
      }

      // `retryReason` is an allowlisted status or static label. Do not log
      // `error`: an HttpError carries the response and JSON body, and a
      // TimeoutError carries the request URL.
      // eslint-disable-next-line no-console
      console.warn(
        `[loadAndEnablePlugin] ${pluginName} manifest fetch failed (attempt ${attempt}/${PLUGIN_MANIFEST_MAX_ATTEMPTS}, ${retryReason}), retrying`,
      );
    }
  }

  if (lastError) {
    onError(
      `[loadAndEnablePlugin] ${pluginName} loadPlugin failed: ${lastError.message}`,
      lastError.cause,
    );
  }

  const plugin = pluginStore.getPluginInfo().find((p) => p.manifest.name === pluginName);

  if (plugin?.status === 'failed') {
    onError(
      `[loadAndEnablePlugin] ${pluginName} loading failed: ${plugin.errorMessage}`,
      plugin.errorCause,
    );
  } else if (plugin?.status === 'loaded') {
    const disablePlugins = (
      plugin.manifest.customProperties?.console?.disableStaticPlugins ?? []
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
  /** Used in @openshift-console/dynamic-plugin-sdk-webpack 1.0.0 - 4.21.x */
  const previousConsoleCallbackName = 'loadPluginEntry';

  window[previousConsoleCallbackName] = (pluginName: string, entryModule: any) => {
    const patchedPluginName = pluginName.includes('@')
      ? pluginName.slice(0, pluginName.lastIndexOf('@'))
      : pluginName;

    // eslint-disable-next-line no-console
    console.warn(
      `[WARNING] ${pluginName} was built for an older version of Console and may not work correctly in this version.`,
    );

    window[REMOTE_ENTRY_CALLBACK](patchedPluginName, entryModule);
  };

  consoleLogger.info(
    `Legacy plugin entry callback ${previousConsoleCallbackName} has been registered`,
  );
};

/**
 * Loads and enables all Console dynamic plugins.
 *
 * Precondition: {@link PluginStore} must be initialized.
 */
export const initConsolePlugins = _.once((pluginStore: PluginStore) => {
  // Polyfill the legacy plugin entry callback function
  registerLegacyPluginEntryCallback();

  // Initialize webpack share scope object and start loading dynamic plugins
  initSharedScope()
    .then(() => {
      const scope = getSharedScope();

      // Patch webpack share scope object for backwards compatibility
      monkeyPatchSharedScope(scope);

      if (process.env.NODE_ENV !== 'production') {
        // Expose webpack share scope object for debugging
        window.pluginSharedScope = scope;
      }
    })
    .then(() => {
      // Load all dynamic (remote) plugins
      dynamicPluginNames.forEach((pluginName) => {
        loadAndEnablePlugin(pluginName, pluginStore, (errorMessage, errorCause) => {
          // eslint-disable-next-line no-console
          console.error(..._.compact([errorMessage, errorCause]));
          addTestError(`${errorMessage}: ${String(errorCause)}`);
        });
      });
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error while loading Console plugins', err);
    });
});
