import { Simulate } from 'react-dom/test-utils';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { ConsolePluginManifestJSON } from '../../schema/plugin-manifest';
import { Extension } from '../../types';
import {
  getPluginManifest,
  getExecutableCodeRefMock,
  getEntryModuleMocks,
} from '../../utils/test-utils';
import * as pluginDependenciesModule from '../plugin-dependencies';
import * as pluginLoaderModule from '../plugin-loader';
import * as pluginManifestModule from '../plugin-manifest';
import { getPluginID } from '../plugin-utils';

const {
  scriptIDPrefix,
  getScriptElementID,
  loadDynamicPlugin,
  getPluginEntryCallback,
  registerPluginEntryCallback,
  loadAndEnablePlugin,
  getStateForTestPurposes,
  resetStateAndEnvForTestPurposes,
} = pluginLoaderModule;

const fetchPluginManifest = jest.spyOn(pluginManifestModule, 'fetchPluginManifest');
const resolvePluginDependencies = jest.spyOn(pluginDependenciesModule, 'resolvePluginDependencies');
const loadDynamicPluginMock = jest.spyOn(pluginLoaderModule, 'loadDynamicPlugin');

const originalConsole = { ...console };
const consoleMock = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  resetStateAndEnvForTestPurposes();
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = consoleMock));
});

afterEach(() => {
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = originalConsole[key]));
});

describe('getScriptElementID', () => {
  it('returns a string formatted as {prefix}@{name}', () => {
    expect(getScriptElementID(getPluginManifest('Test', '1.2.3'))).toBe('console-plugin-Test');
  });
});

describe('loadDynamicPlugin', () => {
  const getScriptElement = (manifest: ConsolePluginManifestJSON) =>
    document.querySelector<HTMLScriptElement>(`[id="${getScriptElementID(manifest)}"]`);

  const getAllScriptElements = () =>
    document.querySelectorAll<HTMLScriptElement>(`[id^="${scriptIDPrefix}"]`);

  it('updates pluginMap and adds a script element to document head', () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    loadDynamicPlugin('http://example.com/test/', manifest);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(1);
    expect(pluginMap.has('Test@1.2.3')).toBe(true);
    expect(pluginMap.get('Test@1.2.3').manifest).toBe(manifest);
    expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(false);

    const script = getScriptElement(manifest);
    expect(script instanceof HTMLScriptElement).toBe(true);
    expect(script.parentElement).toBe(document.head);
    expect(script.id).toBe(getScriptElementID(manifest));
    expect(script.src).toBe('http://example.com/test/plugin-entry.js');
  });

  it('throws an error if a plugin with the same name is already registered', async () => {
    const manifest1 = getPluginManifest('Test', '1.2.3');
    const manifest2 = getPluginManifest('Test', '2.3.4');
    loadDynamicPlugin('http://example.com/test1/', manifest1);

    try {
      await loadDynamicPlugin('http://example.com/test2/', manifest2);
      fail('Expected that loadDynamicPlugin fails and throw an error');
    } catch (error) {
      expect(error).toEqual(new Error('Attempt to reload plugin Test@1.2.3 with Test@2.3.4'));

      const { pluginMap } = getStateForTestPurposes();
      expect(pluginMap.size).toBe(1);
      expect(pluginMap.get('Test@1.2.3').manifest).toBe(manifest1);
      expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(false);

      const allScripts = getAllScriptElements();
      expect(allScripts.length).toBe(1);
      expect(allScripts[0].id).toBe(getScriptElementID(manifest1));
      expect(allScripts[0].src).toBe('http://example.com/test1/plugin-entry.js');

      expect(consoleMock).toHaveBeenCalledTimes(1);
      expect(consoleMock).toHaveBeenCalledWith(
        'Loading entry script for plugin Test@1.2.3 from http://example.com/test1/plugin-entry.js',
      );
    }
  });

  it('returns plugin ID if the script was loaded successfully and the entry callback was fired', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const promise = loadDynamicPlugin('http://example.com/test/', manifest);

    const { pluginMap } = getStateForTestPurposes();
    pluginMap.get('Test@1.2.3').entryCallbackFired = true;

    Simulate.load(getScriptElement(manifest));

    expect(await promise).toBe('Test@1.2.3');
  });

  it('throws an error if the script was loaded successfully but the entry callback was not fired', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const promise = loadDynamicPlugin('http://example.com/test/', manifest);

    Simulate.load(getScriptElement(manifest));

    try {
      await promise;
      fail('Expected that loadDynamicPlugin fails and throw an error');
    } catch (error) {
      expect(error).toEqual(
        new Error('Entry script for plugin Test@1.2.3 loaded without callback'),
      );
      expect(consoleMock).toHaveBeenCalledTimes(1);
      expect(consoleMock).toHaveBeenCalledWith(
        'Loading entry script for plugin Test@1.2.3 from http://example.com/test/plugin-entry.js',
      );
    }
  });

  it('throws an error if the script was not loaded successfully', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const promise = loadDynamicPlugin('http://example.com/test/', manifest);

    Simulate.error(getScriptElement(manifest));

    try {
      await promise;
      fail('Expected that loadDynamicPlugin fails and throw an error');
    } catch (error) {
      expect(error).toEqual(
        new Error('Entry script for plugin Test@1.2.3 loaded without callback'),
      );
      expect(consoleMock).toHaveBeenCalledTimes(1);
      expect(consoleMock).toHaveBeenCalledWith(
        'Loading entry script for plugin Test@1.2.3 from http://example.com/test/plugin-entry.js',
      );
    }
  });
});

describe('registerPluginEntryCallback', () => {
  it('adds loadPluginEntry function to window global object', () => {
    const pluginStore = new PluginStore();
    expect(window.loadPluginEntry).toBeUndefined();

    registerPluginEntryCallback(pluginStore);
    expect(typeof window.loadPluginEntry === 'function').toBe(true);
  });
});

describe('window.loadPluginEntry', () => {
  it('marks the plugin as loaded, resolves its extensions and adds it to plugin store', () => {
    const pluginStore = new PluginStore();
    const addDynamicPlugin = jest.spyOn(pluginStore, 'addDynamicPlugin');

    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: { test: true },
      },
      {
        type: 'Bar',
        properties: { baz: 1, qux: { $codeRef: 'a.b' } },
      },
    ];

    const resolvedExtensions: Extension[] = [
      {
        type: 'Foo',
        properties: { test: true },
      },
      {
        type: 'Bar',
        properties: { baz: 1, qux: getExecutableCodeRefMock('value') },
      },
    ];

    const manifest = getPluginManifest('Test', '1.2.3', extensions);
    const [, entryModule] = getEntryModuleMocks({});
    const { pluginMap } = getStateForTestPurposes();

    const initSharedPluginModules = jest.fn();
    const resolveEncodedCodeRefs = jest.fn(() => resolvedExtensions);

    pluginMap.set(getPluginID(manifest), { manifest, entryCallbackFired: false });

    getPluginEntryCallback(
      pluginStore,
      initSharedPluginModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(true);
    expect(initSharedPluginModules).toHaveBeenCalledWith(entryModule);

    expect(resolveEncodedCodeRefs).toHaveBeenCalledWith(
      manifest.extensions,
      entryModule,
      'Test@1.2.3',
      expect.any(Function),
    );

    expect(addDynamicPlugin).toHaveBeenCalledWith('Test@1.2.3', manifest, resolvedExtensions);
  });

  it('does nothing if the plugin ID is not registered', () => {
    const pluginStore = new PluginStore();
    const addDynamicPlugin = jest.spyOn(pluginStore, 'addDynamicPlugin');

    const [, entryModule] = getEntryModuleMocks({});
    const { pluginMap } = getStateForTestPurposes();

    const initSharedPluginModules = jest.fn();
    const resolveEncodedCodeRefs = jest.fn(() => []);

    getPluginEntryCallback(
      pluginStore,
      initSharedPluginModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    expect(pluginMap.size).toBe(0);
    expect(initSharedPluginModules).not.toHaveBeenCalled();
    expect(resolveEncodedCodeRefs).not.toHaveBeenCalled();
    expect(addDynamicPlugin).not.toHaveBeenCalled();
  });

  it('does nothing if called a second time for the same plugin', () => {
    const pluginStore = new PluginStore();
    const addDynamicPlugin = jest.spyOn(pluginStore, 'addDynamicPlugin');

    const manifest = getPluginManifest('Test', '1.2.3');
    const [, entryModule] = getEntryModuleMocks({});
    const { pluginMap } = getStateForTestPurposes();

    const initSharedPluginModules = jest.fn();
    const resolveEncodedCodeRefs = jest.fn(() => []);

    pluginMap.set(getPluginID(manifest), { manifest, entryCallbackFired: false });

    getPluginEntryCallback(
      pluginStore,
      initSharedPluginModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    getPluginEntryCallback(
      pluginStore,
      initSharedPluginModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    expect(pluginMap.size).toBe(1);
    expect(initSharedPluginModules).toHaveBeenCalledTimes(1);
    expect(resolveEncodedCodeRefs).toHaveBeenCalledTimes(1);
    expect(addDynamicPlugin).toHaveBeenCalledTimes(1);
  });

  it('does nothing if overriding shared modules throws an error', () => {
    const pluginStore = new PluginStore();
    const addDynamicPlugin = jest.spyOn(pluginStore, 'addDynamicPlugin');

    const manifest = getPluginManifest('Test', '1.2.3');
    const [, entryModule] = getEntryModuleMocks({});
    const { pluginMap } = getStateForTestPurposes();

    const initSharedPluginModules = jest.fn(() => {
      throw new Error('boom');
    });
    const resolveEncodedCodeRefs = jest.fn(() => []);

    pluginMap.set(getPluginID(manifest), { manifest, entryCallbackFired: false });

    getPluginEntryCallback(
      pluginStore,
      initSharedPluginModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    expect(pluginMap.size).toBe(1);
    expect(initSharedPluginModules).toHaveBeenCalledWith(entryModule);
    expect(resolveEncodedCodeRefs).not.toHaveBeenCalled();
    expect(addDynamicPlugin).not.toHaveBeenCalled();

    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith(
      'Failed to initialize shared modules for plugin Test@1.2.3',
      new Error('boom'),
    );
  });
});

describe('loadAndEnablePlugin', () => {
  const manifest = getPluginManifest('Test', '1.2.3');

  let pluginStore: PluginStore;
  let setDynamicPluginEnabled: jest.SpyInstance<typeof pluginStore.setDynamicPluginEnabled>;

  beforeEach(() => {
    pluginStore = new PluginStore([], ['Test']);
    setDynamicPluginEnabled = jest.spyOn(pluginStore, 'setDynamicPluginEnabled');
    setDynamicPluginEnabled.mockImplementation(() => {});
  });

  it('loads the plugin from URL /api/plugins/{pluginName}/', async () => {
    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.resolve());
    loadDynamicPluginMock.mockImplementation(() => Promise.resolve('Test@1.2.3'));

    await loadAndEnablePlugin('Test', pluginStore);

    expect(fetchPluginManifest).toHaveBeenCalledWith(
      `${window.SERVER_FLAGS.basePath}api/plugins/Test/`,
    );
    expect(resolvePluginDependencies).toHaveBeenCalledWith(
      manifest,
      ['Test'],
      window.SERVER_FLAGS.releaseVersion,
    );
    expect(loadDynamicPluginMock).toHaveBeenCalledWith(
      `${window.SERVER_FLAGS.basePath}api/plugins/Test/`,
      manifest,
    );
  });

  it('enables the plugin if it was loaded successfully', async () => {
    const onError = jest.fn();

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.resolve());
    loadDynamicPluginMock.mockImplementation(() => Promise.resolve('Test@1.2.3'));

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(setDynamicPluginEnabled).toHaveBeenCalledWith('Test@1.2.3', true);
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls the provided error handler when the plugin fails to load properly', async () => {
    const onError = jest.fn();

    fetchPluginManifest.mockImplementation(() => Promise.reject(new Error('boom1')));

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenLastCalledWith(
      'Error while loading plugin from /api/plugins/Test/',
      new Error('boom1'),
    );

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.reject(new Error('boom2')));

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(onError).toHaveBeenCalledTimes(2);
    expect(consoleMock).toHaveBeenLastCalledWith(
      'Error while loading plugin from /api/plugins/Test/',
      new Error('boom2'),
    );

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.resolve());
    loadDynamicPluginMock.mockImplementation(() => Promise.reject(new Error('boom3')));

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(onError).toHaveBeenCalledTimes(3);
    expect(consoleMock).toHaveBeenLastCalledWith(
      'Error while loading plugin from /api/plugins/Test/',
      new Error('boom3'),
    );

    expect(setDynamicPluginEnabled).not.toHaveBeenCalled();
  });
});
