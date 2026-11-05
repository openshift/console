import type { PluginLoaderInterface } from '@openshift/dynamic-plugin-sdk';
import { TestPluginStore } from '@openshift/dynamic-plugin-sdk';
import {
  initConsolePlugins,
  isDynamicPluginLoadSettled,
  subscribeToDynamicPluginLoads,
} from '../plugin-init';

jest.mock('@console/plugin-sdk/src/utils/allowed-plugins', () => ({
  dynamicPluginNames: ['working-plugin', 'broken-plugin'],
}));

jest.mock('../plugin-shared-modules', () => ({
  initSharedScope: jest.fn(() => Promise.resolve()),
  getSharedScope: jest.fn(() => ({})),
  monkeyPatchSharedScope: jest.fn(),
}));

jest.mock('@console/shared/src/utils/test-errors', () => ({
  addTestError: jest.fn(),
}));

const loader: PluginLoaderInterface = {
  loadPluginManifest: async (manifestURL: string) => {
    if (manifestURL.includes('broken-plugin')) {
      throw new Error('Service Unavailable');
    }
    return {
      name: 'working-plugin',
      version: '1.0.0',
      baseURL: '/api/plugins/working-plugin/',
      extensions: [],
      loadScripts: [],
      registrationMethod: 'callback',
    };
  },
  transformPluginManifest: (manifest) => manifest,
  loadPlugin: async () => ({ success: true as const, loadedExtensions: [] }),
};

describe('initConsolePlugins', () => {
  it('reports finished load attempts, including plugins whose manifest failed to load', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const pluginStore = new TestPluginStore({ loader });
    const listener = jest.fn();
    const allSettled = new Promise<void>((resolve) => {
      subscribeToDynamicPluginLoads(() => {
        listener();
        if (
          isDynamicPluginLoadSettled('working-plugin') &&
          isDynamicPluginLoadSettled('broken-plugin')
        ) {
          resolve();
        }
      });
    });

    expect(isDynamicPluginLoadSettled('broken-plugin')).toBe(false);

    initConsolePlugins(pluginStore);
    await allSettled;

    expect(listener).toHaveBeenCalledTimes(2);
    expect(pluginStore.getPluginInfo().map((entry) => [entry.manifest.name, entry.status])).toEqual(
      [['working-plugin', 'loaded']],
    );

    consoleErrorSpy.mockRestore();
  });
});
