import * as _ from 'lodash';
import * as pluginSubscriptionServiceModule from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { LoadedDynamicPluginInfo, NotLoadedDynamicPluginInfo } from '@console/plugin-sdk/src/store';
import { ConsolePluginManifestJSON } from '../../schema/plugin-manifest';
import { getPluginManifest } from '../../utils/test-utils';
import {
  resolvePluginDependencies,
  getStateForTestPurposes,
  resetStateAndEnvForTestPurposes,
} from '../plugin-dependencies';
import { getPluginID } from '../plugin-utils';

type DynamicPluginListener = Parameters<
  typeof pluginSubscriptionServiceModule.subscribeToDynamicPlugins
>[0];

const subscribeToDynamicPlugins = jest.spyOn(
  pluginSubscriptionServiceModule,
  'subscribeToDynamicPlugins',
);

beforeEach(() => {
  jest.resetAllMocks();
  resetStateAndEnvForTestPurposes();
});

describe('resolvePluginDependencies', () => {
  const getLoadedDynamicPluginInfo = (
    manifest: ConsolePluginManifestJSON,
  ): LoadedDynamicPluginInfo => ({
    status: 'Loaded',
    pluginID: getPluginID(manifest),
    metadata: _.pick(manifest, 'name', 'version', 'dependencies'),
    enabled: true,
  });

  const getPendingDynamicPluginInfo = (
    manifest: ConsolePluginManifestJSON,
  ): NotLoadedDynamicPluginInfo => ({
    status: 'Pending',
    pluginName: manifest.name,
  });

  const getFailedDynamicPluginInfo = (
    manifest: ConsolePluginManifestJSON,
  ): NotLoadedDynamicPluginInfo => ({
    status: 'Failed',
    pluginName: manifest.name,
    errorMessage: `Test error message for plugin ${manifest.name}`,
  });

  it('throws an error if Console plugin API dependency is not met', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.dependencies = { '@console/pluginAPI': '~4.12' };

    try {
      await resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test']);
    } catch (e) {
      expect(e.message).toEqual(
        'Unmet dependency on Console plugin API:\n' +
          '@console/pluginAPI: required ~4.12, current 4.11.1-test.2',
      );
      expect(subscribeToDynamicPlugins).not.toHaveBeenCalled();
      expect(getStateForTestPurposes().unsubListenerMap.size).toBe(0);
    }

    expect.assertions(3);
  });

  it('skips Console plugin API dependency check if the actual version is null', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.dependencies = { '@console/pluginAPI': '~4.12' };

    await resolvePluginDependencies(manifest, null, ['Test']);

    expect(subscribeToDynamicPlugins).not.toHaveBeenCalled();
    expect(getStateForTestPurposes().unsubListenerMap.size).toBe(0);
  });

  it('completes if there are no required plugins', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');

    await resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test', 'Foo', 'Bar']);

    expect(subscribeToDynamicPlugins).not.toHaveBeenCalled();
    expect(getStateForTestPurposes().unsubListenerMap.size).toBe(0);
  });

  it('throws an error if some of the required plugins are not available', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.dependencies = { Foo: '*', Bar: '*' };

    try {
      await resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test']);
    } catch (e) {
      expect(e.message).toEqual('Dependent plugins are not available: Bar, Foo');
      expect(subscribeToDynamicPlugins).not.toHaveBeenCalled();
      expect(getStateForTestPurposes().unsubListenerMap.size).toBe(0);
    }

    expect.assertions(3);
  });

  it('subscribes to changes in dynamic plugin information', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.dependencies = { Foo: '*', Bar: '*' };

    subscribeToDynamicPlugins.mockImplementation((listener: DynamicPluginListener) => {
      listener([
        getPendingDynamicPluginInfo(getPluginManifest('Foo', '1.0.0')),
        getPendingDynamicPluginInfo(getPluginManifest('Bar', '1.0.0')),
      ]);
    });

    await Promise.race([
      resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test', 'Foo', 'Bar']),
      Promise.resolve(), // avoid dependency resolution Promise timeout
    ]);

    expect(subscribeToDynamicPlugins).toHaveBeenCalledTimes(1);
    expect(getStateForTestPurposes().unsubListenerMap.size).toBe(1);
    expect(getStateForTestPurposes().unsubListenerMap.has('Test@1.2.3')).toBe(true);

    try {
      await resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test', 'Foo', 'Bar']);
    } catch (e) {
      expect(e.message).toEqual(
        'Dependency resolution for plugin Test@1.2.3 is already in progress',
      );
      expect(subscribeToDynamicPlugins).toHaveBeenCalledTimes(1);
      expect(getStateForTestPurposes().unsubListenerMap.size).toBe(1);
      expect(getStateForTestPurposes().unsubListenerMap.has('Test@1.2.3')).toBe(true);
    }

    expect.assertions(7);
  });

  it('completes when all required plugins are loaded successfully', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.dependencies = { Foo: '*', Bar: '*' };

    subscribeToDynamicPlugins.mockImplementation((listener: DynamicPluginListener) => {
      listener([
        getLoadedDynamicPluginInfo(getPluginManifest('Foo', '1.0.0')),
        getLoadedDynamicPluginInfo(getPluginManifest('Bar', '1.0.0')),
      ]);
    });

    await resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test', 'Foo', 'Bar']);

    expect(subscribeToDynamicPlugins).toHaveBeenCalledTimes(1);
    expect(getStateForTestPurposes().unsubListenerMap.size).toBe(0);
  });

  it('throws an error if some of the required plugins fail to load successfully', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.dependencies = { Foo: '*', Bar: '*', Baz: '*' };

    subscribeToDynamicPlugins.mockImplementation((listener: DynamicPluginListener) => {
      listener([
        getLoadedDynamicPluginInfo(getPluginManifest('Foo', '1.0.0')),
        getFailedDynamicPluginInfo(getPluginManifest('Bar', '1.0.0')),
        getFailedDynamicPluginInfo(getPluginManifest('Baz', '1.0.0')),
      ]);
    });

    try {
      await resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test', 'Foo', 'Bar', 'Baz']);
    } catch (e) {
      expect(e.message).toEqual('Dependent plugins failed to load: Bar, Baz');
      expect(subscribeToDynamicPlugins).toHaveBeenCalledTimes(1);
      expect(getStateForTestPurposes().unsubListenerMap.size).toBe(0);
    }

    expect.assertions(3);
  });

  it('throws an error if some of the required plugin dependencies are not met', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.dependencies = {
      Foo: '^1.0.0',
      Bar: '~1.1.1',
      Baz: '=1.1.1',
    };

    subscribeToDynamicPlugins.mockImplementation((listener: DynamicPluginListener) => {
      listener([
        getLoadedDynamicPluginInfo(getPluginManifest('Foo', '1.0.0')),
        getLoadedDynamicPluginInfo(getPluginManifest('Bar', '1.1.0')),
        getLoadedDynamicPluginInfo(getPluginManifest('Baz', '1.1.2')),
      ]);
    });

    try {
      await resolvePluginDependencies(manifest, '4.11.1-test.2', ['Test', 'Foo', 'Bar', 'Baz']);
    } catch (e) {
      expect(e.message).toEqual(
        'Unmet dependencies on plugins:\n' +
          'Bar: required ~1.1.1, current 1.1.0\n' +
          'Baz: required =1.1.1, current 1.1.2',
      );
      expect(subscribeToDynamicPlugins).toHaveBeenCalledTimes(1);
      expect(getStateForTestPurposes().unsubListenerMap.size).toBe(0);
    }

    expect.assertions(3);
  });
});
