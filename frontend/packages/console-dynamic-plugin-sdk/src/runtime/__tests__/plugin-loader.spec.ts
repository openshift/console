import { act } from '@testing-library/react';
import { Simulate } from 'react-dom/test-utils';
import { PluginStore } from '@console/plugin-sdk/src/store';
import * as utilsModule from '@console/shared/src/utils/utils';
import { StandardConsolePluginManifest, LegacyConsolePluginManifest } from '../../build-types';
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
  getScriptElementID,
  loadDynamicPlugin,
  getPluginEntryCallback,
  registerPluginEntryCallback,
  adaptPluginManifest,
  loadAndEnablePlugin,
  getStateForTestPurposes,
  resetStateAndEnvForTestPurposes,
} = pluginLoaderModule;

const fetchPluginManifest = jest.spyOn(pluginManifestModule, 'fetchPluginManifest');
const resolvePluginDependencies = jest.spyOn(pluginDependenciesModule, 'resolvePluginDependencies');
const loadDynamicPluginMock = jest.spyOn(pluginLoaderModule, 'loadDynamicPlugin');
const getRandomCharsMock = jest.spyOn(utilsModule, 'getRandomChars');

const originalServerFlags = window.SERVER_FLAGS;

beforeEach(() => {
  jest.resetAllMocks();
  resetStateAndEnvForTestPurposes();
});

describe('getScriptElementID', () => {
  it('returns a string formatted as {pluginName}/{scriptName}', () => {
    expect(getScriptElementID('Test', 'plugin-entry.js')).toBe('Test/plugin-entry.js');
  });
});

describe('loadDynamicPlugin', () => {
  const getAllScripts = () => Array.from(document.scripts);

  const getFirstPluginScript = (manifest: StandardConsolePluginManifest) =>
    getAllScripts().find(
      (element) => element.id === getScriptElementID(manifest.name, manifest.loadScripts[0]),
    );

  beforeEach(() => {
    getRandomCharsMock.mockImplementation(() => 'r4nd0m');
  });

  it('updates pluginMap and adds a script element to document head', () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    loadDynamicPlugin(manifest);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(1);
    expect(pluginMap.has('Test@1.2.3')).toBe(true);
    expect(pluginMap.get('Test@1.2.3').manifest).toBe(manifest);
    expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(false);

    const script = getFirstPluginScript(manifest);
    expect(script instanceof HTMLScriptElement).toBe(true);
    expect(script.parentElement).toBe(document.head);
    expect(script.id).toBe('Test/plugin-entry.js');
    expect(script.src).toBe('http://example.com/Test/plugin-entry.js?cacheBuster=r4nd0m');
    expect(getAllScripts().length).toBe(1);

    expect(getRandomCharsMock).toHaveBeenCalledTimes(1);
  });

  it('throws an error if a plugin with the same name is already registered', async () => {
    const manifest1 = getPluginManifest('Test', '1.2.3');
    const manifest2 = getPluginManifest('Test', '2.3.4');
    loadDynamicPlugin(manifest1);

    try {
      await loadDynamicPlugin(manifest2);
      fail('Expected that loadDynamicPlugin fails and throws an error');
    } catch (error) {
      expect(error).toEqual(new Error('Attempt to reload plugin Test@1.2.3 with Test@2.3.4'));

      const { pluginMap } = getStateForTestPurposes();
      expect(pluginMap.size).toBe(1);
      expect(pluginMap.get('Test@1.2.3').manifest).toBe(manifest1);
      expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(false);

      const script = getFirstPluginScript(manifest1);
      expect(script.id).toBe('Test/plugin-entry.js');
      expect(script.src).toBe('http://example.com/Test/plugin-entry.js?cacheBuster=r4nd0m');
      expect(getAllScripts().length).toBe(1);
    }
  });

  it('throws an error if a plugin does not use callback registration method', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    manifest.registrationMethod = 'custom';

    try {
      await loadDynamicPlugin(manifest);
      fail('Expected that loadDynamicPlugin fails and throws an error');
    } catch (error) {
      expect(error).toEqual(
        new Error('Plugin Test@1.2.3 does not use callback registration method'),
      );

      const { pluginMap } = getStateForTestPurposes();
      expect(pluginMap.size).toBe(0);

      expect(getAllScripts().length).toBe(0);
    }
  });

  it('returns plugin ID if the script was loaded successfully and the entry callback was fired', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const promise = loadDynamicPlugin(manifest);

    const { pluginMap } = getStateForTestPurposes();
    pluginMap.get('Test@1.2.3').entryCallbackFired = true;

    act(() => {
      Simulate.load(getFirstPluginScript(manifest));
    });

    expect(await promise).toBe('Test@1.2.3');
  });

  it('throws an error if the script was loaded successfully but the entry callback was not fired', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const promise = loadDynamicPlugin(manifest);
    const script = getFirstPluginScript(manifest);

    act(() => {
      Simulate.load(script);
    });

    try {
      await promise;
      fail('Expected that loadDynamicPlugin fails and throws an error');
    } catch (error) {
      expect(error).toEqual(
        new Error('Scripts of plugin Test@1.2.3 loaded without entry callback'),
      );
    }
  });

  it('throws an error if the script was not loaded successfully', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const promise = loadDynamicPlugin(manifest);
    const script = getFirstPluginScript(manifest);

    // Invoke script.onerror DOM event handler directly, since the Simulate.error() function
    // does not seem to work as expected (it invokes script.onload DOM event handler instead)
    script.onerror('Test Error Event');

    try {
      await promise;
      fail('Expected that loadDynamicPlugin fails and throws an error');
    } catch (error) {
      expect(error).toEqual(new Error('Detected errors while loading plugin entry scripts'));
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
  });
});

describe('adaptPluginManifest', () => {
  it('returns the same manifest if it already meets the standard format', () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const adaptedManifest = adaptPluginManifest(manifest, 'http://example.com/Test/');

    expect(adaptedManifest).toBe(manifest);
  });

  it('adapts the legacy manifest to the standard format', () => {
    const manifest: LegacyConsolePluginManifest = {
      name: 'Test',
      version: '1.2.3',
      extensions: [],
      displayName: 'Test Plugin',
      description: 'Test Plugin Description',
      disableStaticPlugins: ['StaticTest'],
      dependencies: { RequiredTest: '*' },
    };

    const adaptedManifest = adaptPluginManifest(manifest, 'http://example.com/Test/');

    expect(adaptedManifest).not.toBe(manifest);

    expect(adaptedManifest.name).toBe(manifest.name);
    expect(adaptedManifest.version).toBe(manifest.version);
    expect(adaptedManifest.extensions).toBe(manifest.extensions);
    expect(adaptedManifest.dependencies).toBe(manifest.dependencies);
    expect(adaptedManifest.baseURL).toBe('http://example.com/Test/');
    expect(adaptedManifest.loadScripts).toEqual(['plugin-entry.js']);
    expect(adaptedManifest.registrationMethod).toBe('callback');

    expect(adaptedManifest.customProperties.console.displayName).toBe(manifest.displayName);
    expect(adaptedManifest.customProperties.console.description).toBe(manifest.description);
    expect(adaptedManifest.customProperties.console.disableStaticPlugins).toBe(
      manifest.disableStaticPlugins,
    );
  });
});

describe('loadAndEnablePlugin', () => {
  let pluginStore: PluginStore;
  let setDynamicPluginEnabled: jest.SpyInstance<typeof pluginStore.setDynamicPluginEnabled>;

  beforeEach(() => {
    pluginStore = new PluginStore([], ['Test']);
    setDynamicPluginEnabled = jest.spyOn(pluginStore, 'setDynamicPluginEnabled');
    setDynamicPluginEnabled.mockImplementation(() => {});
  });

  afterEach(() => {
    window.SERVER_FLAGS = originalServerFlags;
  });

  it('loads the plugin from URL {basePath}api/plugins/{pluginName}/', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.resolve());
    loadDynamicPluginMock.mockImplementation(() => Promise.resolve('Test@1.2.3'));

    window.SERVER_FLAGS.basePath = '/test/';
    window.SERVER_FLAGS.releaseVersion = '4.11.1-test.2'; // semver compliant

    await loadAndEnablePlugin('Test', pluginStore);

    expect(fetchPluginManifest).toHaveBeenLastCalledWith('/test/api/plugins/Test/');
    expect(resolvePluginDependencies).toHaveBeenLastCalledWith(manifest, '4.11.1-test.2', ['Test']);
    expect(loadDynamicPluginMock).toHaveBeenLastCalledWith(manifest);

    [fetchPluginManifest, resolvePluginDependencies, loadDynamicPluginMock].forEach((mock) => {
      expect(mock).toHaveBeenCalledTimes(1);
    });

    window.SERVER_FLAGS.releaseVersion = 'abc'; // not semver compliant

    await loadAndEnablePlugin('Test', pluginStore);

    expect(fetchPluginManifest).toHaveBeenLastCalledWith('/test/api/plugins/Test/');
    expect(resolvePluginDependencies).toHaveBeenLastCalledWith(manifest, null, ['Test']);
    expect(loadDynamicPluginMock).toHaveBeenLastCalledWith(manifest);

    [fetchPluginManifest, resolvePluginDependencies, loadDynamicPluginMock].forEach((mock) => {
      expect(mock).toHaveBeenCalledTimes(2);
    });
  });

  it('ensures that the plugin manifest is adapted to the standard format', async () => {
    const manifest: LegacyConsolePluginManifest = {
      name: 'Test',
      version: '1.2.3',
      extensions: [],
      displayName: 'Test Plugin',
      description: 'Test Plugin Description',
      disableStaticPlugins: ['StaticTest'],
      dependencies: { RequiredTest: '*' },
    };

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.resolve());
    loadDynamicPluginMock.mockImplementation(() => Promise.resolve('Test@1.2.3'));

    window.SERVER_FLAGS.basePath = '/';

    await loadAndEnablePlugin('Test', pluginStore);

    expect(loadDynamicPluginMock).toHaveBeenLastCalledWith(
      adaptPluginManifest(manifest, '/api/plugins/Test/'),
    );
  });

  it('enables the plugin if it was loaded successfully', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const onError = jest.fn();

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.resolve());
    loadDynamicPluginMock.mockImplementation(() => Promise.resolve('Test@1.2.3'));

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(setDynamicPluginEnabled).toHaveBeenCalledWith('Test@1.2.3', true);
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls the provided error handler when the plugin fails to load properly', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const onError = jest.fn();

    fetchPluginManifest.mockImplementation(() => Promise.reject(new Error('boom1')));

    window.SERVER_FLAGS.basePath = '/test/';

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenLastCalledWith(
      'Failed to get a valid plugin manifest from /test/api/plugins/Test/',
      new Error('boom1'),
    );

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.reject(new Error('boom2')));

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenLastCalledWith(
      'Failed to resolve dependencies of plugin Test',
      new Error('boom2'),
    );

    fetchPluginManifest.mockImplementation(() => Promise.resolve(manifest));
    resolvePluginDependencies.mockImplementation(() => Promise.resolve());
    loadDynamicPluginMock.mockImplementation(() => Promise.reject(new Error('boom3')));

    await loadAndEnablePlugin('Test', pluginStore, onError);

    expect(onError).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenLastCalledWith(
      'Failed to load scripts of plugin Test',
      new Error('boom3'),
    );

    expect(setDynamicPluginEnabled).not.toHaveBeenCalled();
  });
});
