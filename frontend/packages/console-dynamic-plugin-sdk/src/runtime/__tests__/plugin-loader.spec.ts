import { Extension } from '@console/plugin-sdk/src/typings/base';
import { PluginStore } from '@console/plugin-sdk/src/store';
import {
  scriptIDPrefix,
  getPluginID,
  getScriptElementID,
  loadDynamicPlugin,
  registerPluginEntryCallback,
  getPluginEntryCallback,
  getStateForTestPurposes,
  resetStateAndEnvForTestPurposes,
} from '../plugin-loader';
import { ConsolePluginManifestJSON } from '../../schema/plugin-manifest';
import {
  getPluginManifest,
  getExecutableCodeRefMock,
  getEntryModuleMocks,
} from '../../utils/test-utils';

beforeEach(() => {
  resetStateAndEnvForTestPurposes();
});

describe('getPluginID', () => {
  it('returns a string formatted as {name}@{version}', () => {
    expect(getPluginID(getPluginManifest('Test', '1.2.3'))).toBe('Test@1.2.3');
  });
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

  it('updates pluginMap and adds script element to document head', () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    loadDynamicPlugin('http://example.com/test', manifest);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(1);
    expect(pluginMap.has('Test@1.2.3')).toBe(true);
    expect(pluginMap.get('Test@1.2.3').manifest).toBe(manifest);
    expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(false);

    const script = getScriptElement(manifest);
    expect(script instanceof HTMLScriptElement).toBe(true);
    expect(script.parentElement).toBe(document.head);
    expect(script.id).toBe('console-plugin-Test');
    expect(script.src).toBe('http://example.com/test/plugin-entry.js');
    expect(script.async).toBe(true);
  });

  it('does nothing if a plugin with the same name is already registered', () => {
    const manifest1 = getPluginManifest('Test', '1.2.3');
    const manifest2 = getPluginManifest('Test', '2.3.4');
    loadDynamicPlugin('http://example.com/test1', manifest1);
    loadDynamicPlugin('http://example.com/test2', manifest2);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(1);
    expect(pluginMap.has('Test@1.2.3')).toBe(true);
    expect(pluginMap.get('Test@1.2.3').manifest).toBe(manifest1);
    expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(false);

    const allScripts = getAllScriptElements();
    expect(allScripts.length).toBe(1);
    expect(allScripts[0].id).toBe('console-plugin-Test');
    expect(allScripts[0].src).toBe('http://example.com/test1/plugin-entry.js');
    expect(allScripts[0].async).toBe(true);
  });
});

describe('registerPluginEntryCallback', () => {
  it('adds loadPluginEntry function to window global object', () => {
    const pluginStore = new PluginStore([]);
    expect(window.loadPluginEntry).toBeUndefined();

    registerPluginEntryCallback(pluginStore);
    expect(typeof window.loadPluginEntry === 'function').toBe(true);
  });
});

describe('window.loadPluginEntry', () => {
  it('marks the plugin as loaded, resolves its extensions and adds it to plugin store', () => {
    const pluginStore = new PluginStore([]);
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

    const overrideSharedModules = jest.fn();
    const resolveEncodedCodeRefs = jest.fn(() => resolvedExtensions);

    loadDynamicPlugin('http://example.com/test', manifest);

    getPluginEntryCallback(
      pluginStore,
      overrideSharedModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(1);
    expect(pluginMap.get('Test@1.2.3').manifest).toBe(manifest);
    expect(pluginMap.get('Test@1.2.3').entryCallbackFired).toBe(true);

    expect(overrideSharedModules).toHaveBeenCalledWith(entryModule);

    expect(resolveEncodedCodeRefs).toHaveBeenCalledWith(
      manifest.extensions,
      entryModule,
      'Test@1.2.3',
      expect.any(Function),
    );

    expect(addDynamicPlugin).toHaveBeenCalledWith('Test@1.2.3', manifest, resolvedExtensions);
  });

  it('does nothing if the plugin ID is not registered', () => {
    const pluginStore = new PluginStore([]);
    const addDynamicPlugin = jest.spyOn(pluginStore, 'addDynamicPlugin');

    const [, entryModule] = getEntryModuleMocks({});

    const overrideSharedModules = jest.fn();
    const resolveEncodedCodeRefs = jest.fn(() => []);

    getPluginEntryCallback(
      pluginStore,
      overrideSharedModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(0);

    expect(overrideSharedModules).not.toHaveBeenCalled();
    expect(resolveEncodedCodeRefs).not.toHaveBeenCalled();
    expect(addDynamicPlugin).not.toHaveBeenCalled();
  });

  it('does nothing if called a second time for the same plugin', () => {
    const pluginStore = new PluginStore([]);
    const addDynamicPlugin = jest.spyOn(pluginStore, 'addDynamicPlugin');

    const manifest = getPluginManifest('Test', '1.2.3');
    const [, entryModule] = getEntryModuleMocks({});

    const overrideSharedModules = jest.fn();
    const resolveEncodedCodeRefs = jest.fn(() => []);

    loadDynamicPlugin('http://example.com/test', manifest);

    getPluginEntryCallback(
      pluginStore,
      overrideSharedModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    getPluginEntryCallback(
      pluginStore,
      overrideSharedModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(1);

    expect(overrideSharedModules).toHaveBeenCalledTimes(1);
    expect(resolveEncodedCodeRefs).toHaveBeenCalledTimes(1);
    expect(addDynamicPlugin).toHaveBeenCalledTimes(1);
  });

  it('does nothing if overriding shared modules throws an error', () => {
    const pluginStore = new PluginStore([]);
    const addDynamicPlugin = jest.spyOn(pluginStore, 'addDynamicPlugin');

    const manifest = getPluginManifest('Test', '1.2.3');
    const [, entryModule] = getEntryModuleMocks({});

    const overrideSharedModules = jest.fn(() => {
      throw new Error('boom');
    });
    const resolveEncodedCodeRefs = jest.fn(() => []);

    loadDynamicPlugin('http://example.com/test', manifest);

    getPluginEntryCallback(
      pluginStore,
      overrideSharedModules,
      resolveEncodedCodeRefs,
    )('Test@1.2.3', entryModule);

    const { pluginMap } = getStateForTestPurposes();
    expect(pluginMap.size).toBe(1);

    expect(overrideSharedModules).toHaveBeenCalledWith(entryModule);
    expect(resolveEncodedCodeRefs).not.toHaveBeenCalled();
    expect(addDynamicPlugin).not.toHaveBeenCalled();
  });
});
