import Combinatorics from 'js-combinatorics';
import * as _ from 'lodash';
import {
  getPluginManifest,
  getExecutableCodeRefMock,
} from '@console/dynamic-plugin-sdk/src/utils/test-utils';
import { PodModel } from '@console/internal/models';
import {
  sanitizeExtension,
  augmentExtension,
  isExtensionInUse,
  getGatingFlagNames,
  PluginStore,
} from '../store';
import { Extension, ModelDefinition } from '../typings';

describe('sanitizeExtension', () => {
  it('sanitizes the flags object for both gated and always-on extensions', () => {
    expect(
      sanitizeExtension({
        type: 'Foo/Bar',
        properties: {},
      }),
    ).toEqual({
      type: 'Foo/Bar',
      properties: {},
      flags: {
        required: [],
        disallowed: [],
      },
    });

    expect(
      sanitizeExtension({
        type: 'Foo/Bar',
        properties: {},
        flags: {},
      }),
    ).toEqual({
      type: 'Foo/Bar',
      properties: {},
      flags: {
        required: [],
        disallowed: [],
      },
    });

    expect(
      sanitizeExtension({
        type: 'Foo/Bar',
        properties: {},
        flags: {
          required: ['foo', 'foo', 'bar'],
        },
      }),
    ).toEqual({
      type: 'Foo/Bar',
      properties: {},
      flags: {
        required: ['foo', 'bar'],
        disallowed: [],
      },
    });

    expect(
      sanitizeExtension({
        type: 'Foo/Bar',
        properties: {},
        flags: {
          disallowed: ['foo', 'bar', 'foo'],
        },
      }),
    ).toEqual({
      type: 'Foo/Bar',
      properties: {},
      flags: {
        required: [],
        disallowed: ['foo', 'bar'],
      },
    });

    const alwaysOnExtension: ModelDefinition = {
      type: 'ModelDefinition',
      properties: {
        models: [PodModel],
      },
    };
    expect(sanitizeExtension(alwaysOnExtension)).toEqual({
      type: 'ModelDefinition',
      properties: {
        models: [PodModel],
      },
      flags: {
        required: [],
        disallowed: [],
      },
    });
  });

  it('returns the same extension instance', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };

    expect(sanitizeExtension(testExtension)).toBe(testExtension);
  });
});

describe('augmentExtension', () => {
  it('adds computed properties to extension', () => {
    expect(
      augmentExtension(
        {
          type: 'Foo',
          properties: {},
        },
        'Test@1.2.3',
        'Test',
        0,
      ),
    ).toEqual({
      type: 'Foo',
      properties: {},
      pluginID: 'Test@1.2.3',
      pluginName: 'Test',
      uid: 'Test@1.2.3[0]',
    });

    expect(
      augmentExtension(
        {
          type: 'Bar',
          properties: {},
        },
        'Test',
        'Test',
        1,
      ),
    ).toEqual({
      type: 'Bar',
      properties: {},
      pluginID: 'Test',
      pluginName: 'Test',
      uid: 'Test[1]',
    });
  });

  it('returns the same extension instance', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };

    expect(augmentExtension(testExtension, 'Test@1.2.3', 'Test', 0)).toBe(testExtension);
  });
});

describe('isExtensionInUse', () => {
  const gatedExtension: Extension = {
    type: 'Foo/Bar',
    properties: {},
    flags: {
      required: ['FOO', 'BAR'],
      disallowed: ['BAZ', 'QUX'],
    },
  };

  const flags = (FOO: boolean, BAR: boolean, BAZ: boolean, QUX: boolean) => ({
    FOO,
    BAR,
    BAZ,
    QUX,
  });

  it('returns true only for the right combination of flag values', () => {
    // Generate all possible combinations (i.e. variations with repetition)
    const allFlagCombos = Combinatorics.baseN([true, false, undefined], 4)
      .toArray()
      .map<ReturnType<typeof flags>>((combination) =>
        flags(combination[0], combination[1], combination[2], combination[3]),
      );

    // Enumerate passing combinations
    const passFlagCombos = [flags(true, true, false, false)];

    // Calculate failing combinations as a group difference
    const failFlagCombos = _.differenceWith(allFlagCombos, passFlagCombos, _.isEqual);

    passFlagCombos.forEach((combo) => {
      expect(isExtensionInUse(gatedExtension, combo)).toBe(true);
    });

    failFlagCombos.forEach((combo) => {
      expect(isExtensionInUse(gatedExtension, combo)).toBe(false);
    });
  });
});

describe('getGatingFlagNames', () => {
  it('returns an array of flag names used for gating given extensions', () => {
    const extensions: (ModelDefinition | Extension)[] = [
      {
        type: 'ModelDefinition',
        properties: {
          models: [PodModel],
        },
      },
      {
        type: 'Foo',
        properties: {},
        flags: {
          required: ['foo', 'bar'],
          disallowed: ['qux'],
        },
      },
      {
        type: 'Bar',
        properties: {},
        flags: {
          required: ['bar', 'baz'],
          disallowed: ['qux', 'test'],
        },
      },
    ].map(sanitizeExtension);

    expect(getGatingFlagNames(extensions)).toEqual(['foo', 'bar', 'baz', 'qux', 'test']);
  });
});

describe('PluginStore', () => {
  const addDynamicPluginToStore = (
    store: PluginStore,
    manifest: ReturnType<typeof getPluginManifest>,
    resolvedExtensions: Extension[] = manifest.extensions,
  ) => {
    store.addDynamicPlugin(`${manifest.name}@${manifest.version}`, manifest, resolvedExtensions);
  };

  describe('constructor', () => {
    it('initializes static plugin information', () => {
      const store = new PluginStore([
        {
          name: 'Test',
          extensions: [
            { type: 'Foo', properties: { test: true }, flags: { required: ['foo'] } },
            { type: 'Bar', properties: { baz: 1 }, flags: { disallowed: ['bar'] } },
          ],
        },
      ]);

      const {
        staticPluginExtensions,
        staticPlugins,
        disabledStaticPluginNames,
      } = store.getStateForTestPurposes();

      expect(staticPluginExtensions).toEqual([
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: ['foo'], disallowed: [] },
          pluginID: 'Test',
          pluginName: 'Test',
          uid: 'Test[0]',
        },
        {
          type: 'Bar',
          properties: { baz: 1 },
          flags: { required: [], disallowed: ['bar'] },
          pluginID: 'Test',
          pluginName: 'Test',
          uid: 'Test[1]',
        },
      ]);

      staticPluginExtensions.forEach((e) => {
        expect(Object.isFrozen(e)).toBe(true);
      });

      expect(staticPlugins).toEqual([
        {
          name: 'Test',
          extensions: staticPluginExtensions,
        },
      ]);

      expect(disabledStaticPluginNames).toEqual(new Set());
      expect(store.getExtensionsInUse()).toEqual(staticPluginExtensions);
    });

    it('initializes dynamic plugin information', () => {
      const store = new PluginStore([], ['TestA', 'TestB']);

      const {
        dynamicPluginExtensions,
        loadedDynamicPlugins,
        failedDynamicPluginNames,
      } = store.getStateForTestPurposes();

      expect(dynamicPluginExtensions).toEqual([]);
      expect(loadedDynamicPlugins.size).toBe(0);
      expect(failedDynamicPluginNames.size).toBe(0);

      expect(store.getExtensionsInUse()).toEqual([]);
      expect(store.getAllowedDynamicPluginNames()).toEqual(['TestA', 'TestB']);
      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Pending',
          pluginName: 'TestA',
        },
        {
          status: 'Pending',
          pluginName: 'TestB',
        },
      ]);
    });
  });

  describe('getExtensionsInUse', () => {
    it('returns a list of static and dynamic extensions currently in use', () => {
      const store = new PluginStore(
        [
          {
            name: 'Test',
            extensions: [
              { type: 'Foo', properties: { test: true }, flags: { required: ['foo'] } },
              { type: 'Bar', properties: { baz: 1 }, flags: { disallowed: ['bar'] } },
            ],
          },
        ],
        ['TestA', 'TestB', 'TestC'],
      );

      expect(store.getExtensionsInUse()).toEqual([
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: ['foo'], disallowed: [] },
          pluginID: 'Test',
          pluginName: 'Test',
          uid: 'Test[0]',
        },
        {
          type: 'Bar',
          properties: { baz: 1 },
          flags: { required: [], disallowed: ['bar'] },
          pluginID: 'Test',
          pluginName: 'Test',
          uid: 'Test[1]',
        },
      ]);

      const dynamicPluginExtensionsA: Extension[] = [
        { type: 'Baz', properties: {}, flags: { disallowed: ['foo', 'bar'] } },
      ];

      const dynamicPluginExtensionsB: Extension[] = [
        { type: 'Qux', properties: { value: 'test' }, flags: { required: ['foo', 'bar'] } },
      ];

      const dynamicPluginExtensionsC: Extension[] = [
        { type: 'Mux', properties: {}, flags: { required: ['foo'], disallowed: ['bar'] } },
      ];

      addDynamicPluginToStore(store, getPluginManifest('TestB', '1.2.3', dynamicPluginExtensionsB));
      addDynamicPluginToStore(store, getPluginManifest('TestC', '2.3.4', dynamicPluginExtensionsC));

      store.setDynamicPluginEnabled('TestB@1.2.3', true);
      store.setDynamicPluginEnabled('TestC@2.3.4', true);

      expect(store.getExtensionsInUse()).toEqual([
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: ['foo'], disallowed: [] },
          pluginID: 'Test',
          pluginName: 'Test',
          uid: 'Test[0]',
        },
        {
          type: 'Bar',
          properties: { baz: 1 },
          flags: { required: [], disallowed: ['bar'] },
          pluginID: 'Test',
          pluginName: 'Test',
          uid: 'Test[1]',
        },
        {
          type: 'Qux',
          properties: { value: 'test' },
          flags: { required: ['foo', 'bar'], disallowed: [] },
          pluginID: 'TestB@1.2.3',
          pluginName: 'TestB',
          uid: 'TestB@1.2.3[0]',
        },
        {
          type: 'Mux',
          properties: {},
          flags: { required: ['foo'], disallowed: ['bar'] },
          pluginID: 'TestC@2.3.4',
          pluginName: 'TestC',
          uid: 'TestC@2.3.4[0]',
        },
      ]);

      addDynamicPluginToStore(
        store,
        getPluginManifest('TestA', '3.4.5', dynamicPluginExtensionsA, ['Test']),
      );

      expect(store.getExtensionsInUse()).toEqual([
        {
          type: 'Qux',
          properties: { value: 'test' },
          flags: { required: ['foo', 'bar'], disallowed: [] },
          pluginID: 'TestB@1.2.3',
          pluginName: 'TestB',
          uid: 'TestB@1.2.3[0]',
        },
        {
          type: 'Mux',
          properties: {},
          flags: { required: ['foo'], disallowed: ['bar'] },
          pluginID: 'TestC@2.3.4',
          pluginName: 'TestC',
          uid: 'TestC@2.3.4[0]',
        },
      ]);

      store.setDynamicPluginEnabled('TestA@3.4.5', true);

      expect(store.getExtensionsInUse()).toEqual([
        {
          type: 'Qux',
          properties: { value: 'test' },
          flags: { required: ['foo', 'bar'], disallowed: [] },
          pluginID: 'TestB@1.2.3',
          pluginName: 'TestB',
          uid: 'TestB@1.2.3[0]',
        },
        {
          type: 'Mux',
          properties: {},
          flags: { required: ['foo'], disallowed: ['bar'] },
          pluginID: 'TestC@2.3.4',
          pluginName: 'TestC',
          uid: 'TestC@2.3.4[0]',
        },
        {
          type: 'Baz',
          properties: {},
          flags: { required: [], disallowed: ['foo', 'bar'] },
          pluginID: 'TestA@3.4.5',
          pluginName: 'TestA',
          uid: 'TestA@3.4.5[0]',
        },
      ]);

      store.setDynamicPluginEnabled('TestA@3.4.5', false);

      expect(store.getExtensionsInUse()).toEqual([
        {
          type: 'Qux',
          properties: { value: 'test' },
          flags: { required: ['foo', 'bar'], disallowed: [] },
          pluginID: 'TestB@1.2.3',
          pluginName: 'TestB',
          uid: 'TestB@1.2.3[0]',
        },
        {
          type: 'Mux',
          properties: {},
          flags: { required: ['foo'], disallowed: ['bar'] },
          pluginID: 'TestC@2.3.4',
          pluginName: 'TestC',
          uid: 'TestC@2.3.4[0]',
        },
      ]);
    });
  });

  describe('subscribe', () => {
    it('adds the given listener to the list of registered listeners', () => {
      const store = new PluginStore();

      expect(store.getStateForTestPurposes().listeners).toEqual([]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      expect(store.getStateForTestPurposes().listeners).toEqual(listeners);
    });

    it('returns a function to unsubscribe the given listener', () => {
      const store = new PluginStore();

      const listeners = [jest.fn(), jest.fn()];
      const unsubscribes = listeners.map((l) => store.subscribe(l));

      expect(store.getStateForTestPurposes().listeners).toEqual(listeners);

      unsubscribes.forEach((unsub) => {
        unsub();
      });

      expect(store.getStateForTestPurposes().listeners).toEqual([]);
    });

    it('invokes the listener when extensions in use or dynamic plugin information changes', () => {
      const store = new PluginStore([], ['TestA', 'TestB']);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      addDynamicPluginToStore(
        store,
        getPluginManifest('TestA', '1.2.3', [{ type: 'Foo', properties: {} }]),
      );

      store.setDynamicPluginEnabled('TestA@1.2.3', true);
      store.registerFailedDynamicPlugin('TestB');

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(3);
        expect(l.mock.calls).toEqual([[], [], []]);
      });
    });
  });

  describe('addDynamicPlugin', () => {
    it('adds the given plugin into loadedDynamicPlugins', () => {
      const store = new PluginStore([], ['Test']);

      const manifest = getPluginManifest('Test', '1.2.3', [
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: ['foo'] },
        },
        {
          type: 'Bar',
          properties: { baz: 1, qux: { $codeRef: 'a.b' } },
          flags: { disallowed: ['bar'] },
        },
      ]);

      const ref = getExecutableCodeRefMock('value');

      const resolvedExtensions: Extension[] = [
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: ['foo'] },
        },
        {
          type: 'Bar',
          properties: { baz: 1, qux: ref },
          flags: { disallowed: ['bar'] },
        },
      ];

      addDynamicPluginToStore(store, manifest, resolvedExtensions);

      const { dynamicPluginExtensions, loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(dynamicPluginExtensions).toEqual([]);
      expect(loadedDynamicPlugins.size).toBe(1);
      expect(loadedDynamicPlugins.has('Test@1.2.3')).toBe(true);

      const testPlugin = loadedDynamicPlugins.get('Test@1.2.3');

      expect(testPlugin).toEqual({
        manifest,
        processedExtensions: [
          {
            type: 'Foo',
            properties: { test: true },
            flags: { required: ['foo'], disallowed: [] },
            pluginID: 'Test@1.2.3',
            pluginName: 'Test',
            uid: 'Test@1.2.3[0]',
          },
          {
            type: 'Bar',
            properties: { baz: 1, qux: ref },
            flags: { required: [], disallowed: ['bar'] },
            pluginID: 'Test@1.2.3',
            pluginName: 'Test',
            uid: 'Test@1.2.3[1]',
          },
        ],
        enabled: false,
      });

      expect(Object.isFrozen(testPlugin.manifest)).toBe(true);

      testPlugin.processedExtensions.forEach((e) => {
        expect(Object.isFrozen(e)).toBe(true);
      });

      expect(store.getExtensionsInUse()).toEqual([]);
      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Loaded',
          pluginID: 'Test@1.2.3',
          metadata: _.omit(manifest, 'extensions'),
          enabled: false,
        },
      ]);
    });

    it('does nothing if a plugin with the same ID is already registered', () => {
      const store = new PluginStore([], ['Test']);

      const manifest1 = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);
      const manifest2 = getPluginManifest('Test', '1.2.3', [{ type: 'Bar', properties: {} }]);

      addDynamicPluginToStore(store, manifest1);
      addDynamicPluginToStore(store, manifest2);

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.size).toBe(1);
      expect(loadedDynamicPlugins.has('Test@1.2.3')).toBe(true);

      const testPlugin = loadedDynamicPlugins.get('Test@1.2.3');

      expect(testPlugin).toEqual({
        manifest: manifest1,
        processedExtensions: [
          {
            type: 'Foo',
            properties: {},
            flags: { required: [], disallowed: [] },
            pluginID: 'Test@1.2.3',
            pluginName: 'Test',
            uid: 'Test@1.2.3[0]',
          },
        ],
        enabled: false,
      });
    });

    it('does nothing if the plugin is not listed via allowedDynamicPluginNames', () => {
      const store = new PluginStore([], ['TestA', 'TestB']);

      addDynamicPluginToStore(
        store,
        getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]),
      );

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.size).toBe(0);
    });

    it('does nothing if the plugin is already listed via failedDynamicPluginNames', () => {
      const store = new PluginStore([], ['Test']);

      store.registerFailedDynamicPlugin('Test');

      addDynamicPluginToStore(
        store,
        getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]),
      );

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.size).toBe(0);
    });

    it('disables static plugins according to the manifest', () => {
      const store = new PluginStore(
        [
          {
            name: 'Test1',
            extensions: [{ type: 'Foo', properties: { test: true } }],
          },
          {
            name: 'Test2',
            extensions: [{ type: 'Bar', properties: { baz: 1 } }],
          },
        ],
        ['TestA', 'TestB'],
      );

      const { disabledStaticPluginNames } = store.getStateForTestPurposes();

      expect(disabledStaticPluginNames).toEqual(new Set());
      expect(store.getExtensionsInUse()).toEqual([
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: [], disallowed: [] },
          pluginID: 'Test1',
          pluginName: 'Test1',
          uid: 'Test1[0]',
        },
        {
          type: 'Bar',
          properties: { baz: 1 },
          flags: { required: [], disallowed: [] },
          pluginID: 'Test2',
          pluginName: 'Test2',
          uid: 'Test2[0]',
        },
      ]);

      addDynamicPluginToStore(
        store,
        getPluginManifest('TestA', '1.2.3', [{ type: 'Qux', properties: {} }], ['Test1']),
      );

      expect(disabledStaticPluginNames).toEqual(new Set(['Test1']));
      expect(store.getExtensionsInUse()).toEqual([
        {
          type: 'Bar',
          properties: { baz: 1 },
          flags: { required: [], disallowed: [] },
          pluginID: 'Test2',
          pluginName: 'Test2',
          uid: 'Test2[0]',
        },
      ]);

      addDynamicPluginToStore(
        store,
        getPluginManifest('TestB', '2.3.4', [{ type: 'Mux', properties: {} }], ['Test0', 'Test2']),
      );

      expect(disabledStaticPluginNames).toEqual(new Set(['Test1', 'Test2']));
      expect(store.getExtensionsInUse()).toEqual([]);
    });
  });

  describe('setDynamicPluginEnabled', () => {
    it('recomputes all extensions in use and calls all registered listeners', () => {
      const store = new PluginStore([], ['TestA', 'TestB']);

      addDynamicPluginToStore(
        store,
        getPluginManifest('TestA', '1.2.3', [{ type: 'Foo', properties: {} }]),
      );

      addDynamicPluginToStore(
        store,
        getPluginManifest('TestB', '2.3.4', [{ type: 'Bar', properties: {} }]),
      );

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.get('TestA@1.2.3').enabled).toBe(false);
      expect(loadedDynamicPlugins.get('TestB@2.3.4').enabled).toBe(false);

      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('TestA@1.2.3', true);

      expect(loadedDynamicPlugins.get('TestA@1.2.3').enabled).toBe(true);
      expect(loadedDynamicPlugins.get('TestB@2.3.4').enabled).toBe(false);

      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([
        {
          type: 'Foo',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'TestA@1.2.3',
          pluginName: 'TestA',
          uid: 'TestA@1.2.3[0]',
        },
      ]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
      });

      store.setDynamicPluginEnabled('TestB@2.3.4', true);

      expect(loadedDynamicPlugins.get('TestA@1.2.3').enabled).toBe(true);
      expect(loadedDynamicPlugins.get('TestB@2.3.4').enabled).toBe(true);

      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([
        {
          type: 'Foo',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'TestA@1.2.3',
          pluginName: 'TestA',
          uid: 'TestA@1.2.3[0]',
        },
        {
          type: 'Bar',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'TestB@2.3.4',
          pluginName: 'TestB',
          uid: 'TestB@2.3.4[0]',
        },
      ]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(2);
      });

      store.setDynamicPluginEnabled('TestA@1.2.3', false);

      expect(loadedDynamicPlugins.get('TestA@1.2.3').enabled).toBe(false);
      expect(loadedDynamicPlugins.get('TestB@2.3.4').enabled).toBe(true);

      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([
        {
          type: 'Bar',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'TestB@2.3.4',
          pluginName: 'TestB',
          uid: 'TestB@2.3.4[0]',
        },
      ]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(3);
      });
    });

    it('does nothing if the plugin is not loaded', () => {
      const store = new PluginStore([], ['Test']);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      store.setDynamicPluginEnabled('Test@1.2.3', true);

      expect(loadedDynamicPlugins.size).toBe(0);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions.length).toBe(0);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });
    });

    it('does nothing if the plugin is already enabled or disabled', () => {
      const store = new PluginStore([], ['Test']);

      addDynamicPluginToStore(
        store,
        getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]),
      );

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.get('Test@1.2.3').enabled).toBe(false);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions.length).toBe(0);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('Test@1.2.3', false);

      expect(loadedDynamicPlugins.get('Test@1.2.3').enabled).toBe(false);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions.length).toBe(0);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('Test@1.2.3', true);

      expect(loadedDynamicPlugins.get('Test@1.2.3').enabled).toBe(true);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions.length).toBe(1);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
      });

      store.setDynamicPluginEnabled('Test@1.2.3', true);

      expect(loadedDynamicPlugins.get('Test@1.2.3').enabled).toBe(true);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions.length).toBe(1);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
      });
    });
  });

  describe('registerFailedDynamicPlugin', () => {
    it('adds the given plugin name to failedDynamicPluginNames', () => {
      const store = new PluginStore([], ['Test']);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { failedDynamicPluginNames } = store.getStateForTestPurposes();

      expect(failedDynamicPluginNames).toEqual(new Set());

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.registerFailedDynamicPlugin('Test');

      expect(failedDynamicPluginNames).toEqual(new Set(['Test']));

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
      });
    });

    it('does nothing if the plugin is not listed via allowedDynamicPluginNames', () => {
      const store = new PluginStore([], ['TestA', 'TestB']);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { failedDynamicPluginNames } = store.getStateForTestPurposes();

      store.registerFailedDynamicPlugin('Test');

      expect(failedDynamicPluginNames).toEqual(new Set());

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });
    });

    it('does nothing if the plugin is already loaded', () => {
      const store = new PluginStore([], ['Test']);

      addDynamicPluginToStore(
        store,
        getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]),
      );

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { failedDynamicPluginNames } = store.getStateForTestPurposes();

      store.registerFailedDynamicPlugin('Test');

      expect(failedDynamicPluginNames).toEqual(new Set());

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });
    });
  });

  describe('getDynamicPluginInfo', () => {
    it('returns plugin runtime information for all known dynamic plugins', () => {
      const store = new PluginStore([], ['TestA', 'TestB']);

      const manifest = getPluginManifest('TestA', '1.2.3', [{ type: 'Foo', properties: {} }]);

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Pending',
          pluginName: 'TestA',
        },
        {
          status: 'Pending',
          pluginName: 'TestB',
        },
      ]);

      addDynamicPluginToStore(store, manifest);

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Loaded',
          pluginID: 'TestA@1.2.3',
          metadata: _.omit(manifest, 'extensions'),
          enabled: false,
        },
        {
          status: 'Pending',
          pluginName: 'TestB',
        },
      ]);

      store.setDynamicPluginEnabled('TestA@1.2.3', true);

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Loaded',
          pluginID: 'TestA@1.2.3',
          metadata: _.omit(manifest, 'extensions'),
          enabled: true,
        },
        {
          status: 'Pending',
          pluginName: 'TestB',
        },
      ]);

      store.registerFailedDynamicPlugin('TestB');

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Loaded',
          pluginID: 'TestA@1.2.3',
          metadata: _.omit(manifest, 'extensions'),
          enabled: true,
        },
        {
          status: 'Failed',
          pluginName: 'TestB',
        },
      ]);
    });
  });
});
