import * as _ from 'lodash';
import * as semver from 'semver';
import { subscribeToDynamicPlugins } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { ConsolePluginManifest } from '../build-types';
import { CustomError } from '../utils/error/custom-error';
import { getPluginID } from './plugin-utils';

class UnmetPluginDependenciesError extends CustomError {
  constructor(message: string, unmetDependencies: string[]) {
    super(`${message}: ${unmetDependencies.join('; ')}`);
  }
}

const unsubListenerMap = new Map<string, VoidFunction>();

const cleanupListener = (pluginID: string) => {
  if (unsubListenerMap.has(pluginID)) {
    unsubListenerMap.get(pluginID)();
    unsubListenerMap.delete(pluginID);
  }
};

const formatPluginNames = (values: string[]) =>
  values.sort((a, b) => a.localeCompare(b)).join(', ');

const formatUnmetDependency = (depName: string, requiredRange: string, currentVersion: string) =>
  `${depName}: required ${requiredRange}, current ${currentVersion}`;

/**
 * Resolve all dependencies within the given plugin manifest.
 *
 * `consolePluginAPIVersion` may be `null` which indicates that Console was not able to parse
 * the semver version properly. In that case, the corresponding dependency check will be skipped.
 */
export const resolvePluginDependencies = (
  manifest: ConsolePluginManifest,
  consolePluginAPIVersion: string,
  allowedPluginNames: string[],
) => {
  const pluginID = getPluginID(manifest);

  if (unsubListenerMap.has(pluginID)) {
    throw new Error(`Dependency resolution for plugin ${pluginID} is already in progress`);
  }

  const requiredDependencies = manifest.dependencies ?? {};
  const optionalDependencies = manifest.optionalDependencies ?? {};

  const isRequiredDependency = (name: string) => Object.keys(requiredDependencies).includes(name);
  const isOptionalDependency = (name: string) => Object.keys(optionalDependencies).includes(name);

  // The `@console/pluginAPI` dependency refers to Console web application.
  // Any other dependencies are assumed to refer to Console dynamic plugins.
  const pluginAPIDepName = '@console/pluginAPI';
  const isPluginDependency = (name: string) => name !== pluginAPIDepName;

  // eslint-disable-next-line no-console
  console.info(`Resolving dependencies for plugin ${pluginID}`);

  // Include prerelease tag (if present) in the range check
  // https://github.com/npm/node-semver#prerelease-tags
  const semverOptions: semver.Options = { includePrerelease: true };

  // Ensure compatibility with Console application
  if (
    consolePluginAPIVersion &&
    isRequiredDependency(pluginAPIDepName) &&
    !semver.satisfies(
      consolePluginAPIVersion,
      requiredDependencies[pluginAPIDepName],
      semverOptions,
    )
  ) {
    throw new UnmetPluginDependenciesError('Unmet dependency on Console plugin API', [
      formatUnmetDependency(
        pluginAPIDepName,
        requiredDependencies[pluginAPIDepName],
        consolePluginAPIVersion,
      ),
    ]);
  }

  // Ensure compatibility with other dynamic plugins
  const requiredButUnavailablePluginNames = _.difference(
    Object.keys(requiredDependencies).filter(isPluginDependency),
    allowedPluginNames,
  );

  if (requiredButUnavailablePluginNames.length > 0) {
    throw new Error(
      `Required plugins are not available: ${formatPluginNames(requiredButUnavailablePluginNames)}`,
    );
  }

  const preloadPluginNames = allowedPluginNames.filter(
    (name) => isRequiredDependency(name) || isOptionalDependency(name),
  );

  if (preloadPluginNames.length === 0) {
    return Promise.resolve();
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
        if (e.status === 'loaded' && preloadPluginNames.includes(e.manifest.name)) {
          acc[e.manifest.name] = e.manifest.version;
        }
        return acc;
      }, {});

      const failedPluginNames = entries.reduce<string[]>((acc, e) => {
        if (e.status === 'failed' && preloadPluginNames.includes(e.manifest.name)) {
          acc.push(e.manifest.name);
        }
        return acc;
      }, []);

      if (failedPluginNames.length > 0) {
        rejectPromise(
          new Error(`Dependent plugins failed to load: ${formatPluginNames(failedPluginNames)}`),
        );
      } else if (_.isEqual(_.sortBy(preloadPluginNames), _.sortBy(Object.keys(loadedPlugins)))) {
        const unmetDependencies: string[] = [];

        preloadPluginNames.forEach((pluginName) => {
          const preloadPluginVersionRange =
            requiredDependencies[pluginName] || optionalDependencies[pluginName];

          if (
            !semver.satisfies(loadedPlugins[pluginName], preloadPluginVersionRange, semverOptions)
          ) {
            unmetDependencies.push(
              formatUnmetDependency(
                pluginName,
                preloadPluginVersionRange,
                loadedPlugins[pluginName],
              ),
            );
          }
        });

        if (unmetDependencies.length > 0) {
          rejectPromise(
            new UnmetPluginDependenciesError('Unmet dependencies on plugins', unmetDependencies),
          );
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
