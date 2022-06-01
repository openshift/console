import * as _ from 'lodash';
import * as semver from 'semver';
import { subscribeToDynamicPlugins } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { getPluginID } from './plugin-utils';

const unsubListenerMap = new Map<string, VoidFunction>();

const cleanupListener = (pluginID: string) => {
  if (unsubListenerMap.has(pluginID)) {
    unsubListenerMap.get(pluginID)();
    unsubListenerMap.delete(pluginID);
  }
};

const formatPluginNames = (values: string[]) =>
  values.sort((a, b) => a.localeCompare(b)).join(', ');

export const resolvePluginDependencies = (
  manifest: ConsolePluginManifestJSON,
  allowedPluginNames: string[],
  consolePluginAPIVersion: string,
) => {
  const { dependencies } = manifest;
  const pluginID = getPluginID(manifest);

  if (unsubListenerMap.has(pluginID)) {
    throw new Error(`Dependency resolution for plugin ${pluginID} is already in progress`);
  }

  // Ensure compatibility with current Console plugin API
  const pluginAPIDepName = '@console/pluginAPI';

  if (!semver.satisfies(consolePluginAPIVersion, dependencies[pluginAPIDepName])) {
    throw new Error(
      `Unmet dependency ${pluginAPIDepName}: required ${dependencies[pluginAPIDepName]}, current ${consolePluginAPIVersion}`,
    );
  }

  // Ensure compatibility with other dynamic plugins
  const requiredPluginNames = _.difference(Object.keys(dependencies), [pluginAPIDepName]);
  const unavailablePluginNames = _.difference(requiredPluginNames, allowedPluginNames);

  if (requiredPluginNames.length === 0) {
    return Promise.resolve();
  }

  if (unavailablePluginNames.length > 0) {
    throw new Error(
      `Dependent plugins are not available: ${formatPluginNames(unavailablePluginNames)}`,
    );
  }

  // Wait for all dependent plugins to be loaded before resolving the Promise.
  // If some of them fail to load successfully, the Promise will be rejected.
  return new Promise<void>((resolve, reject) => {
    let promiseSettled = false;

    const resolvePromise = () => {
      promiseSettled = true;
      cleanupListener(pluginID);
      resolve();
    };

    const rejectPromise = (reason) => {
      promiseSettled = true;
      cleanupListener(pluginID);
      reject(reason);
    };

    const unsubListener = subscribeToDynamicPlugins((entries) => {
      const loadedPlugins = entries.reduce<Record<string, string>>((acc, e) => {
        if (e.status === 'Loaded' && requiredPluginNames.includes(e.metadata.name)) {
          acc[e.metadata.name] = e.metadata.version;
        }
        return acc;
      }, {});

      const failedPluginNames = entries.reduce<string[]>((acc, e) => {
        if (e.status === 'Failed' && requiredPluginNames.includes(e.pluginName)) {
          acc.push(e.pluginName);
        }
        return acc;
      }, []);

      if (failedPluginNames.length > 0) {
        rejectPromise(
          new Error(`Dependent plugins failed to load: ${formatPluginNames(failedPluginNames)}`),
        );
      } else if (_.isEqual(requiredPluginNames, Object.keys(loadedPlugins))) {
        const unmetDependencyErrors: string[] = [];

        requiredPluginNames.forEach((pluginName) => {
          if (!semver.satisfies(loadedPlugins[pluginName], dependencies[pluginName])) {
            unmetDependencyErrors.push(
              `Unmet dependency ${pluginName}: required ${dependencies[pluginName]}, current ${loadedPlugins[pluginName]}`,
            );
          }
        });

        if (unmetDependencyErrors.length > 0) {
          rejectPromise(new Error(unmetDependencyErrors.join('\n')));
        } else {
          resolvePromise();
        }
      }
    });

    // subscribeToDynamicPlugins immediately invokes the provided listener,
    // which may cause the dependency resolution Promise to be settled already
    if (!promiseSettled) {
      unsubListenerMap.set(pluginID, unsubListener);
    }
  });
};

export const getStateForTestPurposes = () => ({
  unsubListenerMap,
});

export const resetStateAndEnvForTestPurposes = () => {
  unsubListenerMap.clear();
};
