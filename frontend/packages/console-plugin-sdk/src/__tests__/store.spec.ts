import * as Combinatorics from 'js-combinatorics';
import * as _ from 'lodash';
import { mergeExtensionProperties } from '@console/dynamic-plugin-sdk/src/utils/store';
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

describe('mergeExtensionProperties', () => {
  it('shallowly merges the given object into extension properties', () => {
    expect(
      mergeExtensionProperties(
        {
          type: 'Foo/Bar',
          properties: {},
        },
        {
          test: true,
          qux: { foo: ['value'], baz: 1 },
        },
      ),
    ).toEqual({
      type: 'Foo/Bar',
      properties: {
        test: true,
        qux: { foo: ['value'], baz: 1 },
      },
    });

    expect(
      mergeExtensionProperties(
        {
          type: 'Foo/Bar',
          properties: {
            test: true,
            qux: { foo: ['value'], baz: 1 },
          },
        },
        {
          test: false,
          qux: { baz: 2 },
        },
      ),
    ).toEqual({
      type: 'Foo/Bar',
      properties: {
        test: false,
        qux: { baz: 2 },
      },
    });
  });

  it('returns a new extension instance', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };
    const updatedExtension = mergeExtensionProperties(testExtension, {});

    expect(updatedExtension).not.toBe(testExtension);
    expect(Object.isFrozen(updatedExtension)).toBe(true);
  });
});

describe('PluginStore', () => {
  describe('constructor', () => {
    it('maps provided static plugins into static extensions', () => {
      const store = new PluginStore([
        {
          name: 'Test',
          extensions: [
            { type: 'Foo', properties: { test: true }, flags: { required: ['foo'] } },
            { type: 'Bar', properties: { baz: 1 }, flags: { disallowed: ['bar'] } },
          ],
        },
      ]);

      const { staticPluginExtensions } = store.getStateForTestPurposes();

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

      expect(store.getAllExtensions()).toEqual(staticPluginExtensions);
    });

    it('starts off with no information on dynamic plugins', () => {
      const store = new PluginStore();

      const {
        dynamicPluginExtensions,
        loadedDynamicPlugins,
        failedDynamicPluginNames,
      } = store.getStateForTestPurposes();

      expect(dynamicPluginExtensions).toEqual([]);
      expect(loadedDynamicPlugins.size).toBe(0);
      expect(failedDynamicPluginNames.size).toBe(0);

      expect(store.getAllExtensions()).toEqual([]);
      expect(store.getDynamicPluginInfo()).toEqual([]);
    });
  });

  describe('getAllExtensions', () => {
    it('returns an aggregated list of static and dynamic extensions', () => {
      const store = new PluginStore(
        [
          {
            name: 'Test0',
            extensions: [
              { type: 'Foo', properties: { test: true }, flags: { required: ['foo'] } },
              { type: 'Bar', properties: { baz: 1 }, flags: { disallowed: ['bar'] } },
            ],
          },
        ],
        new Set(['Test1', 'Test2']),
      );

      expect(store.getAllExtensions()).toEqual([
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: ['foo'], disallowed: [] },
          pluginID: 'Test0',
          pluginName: 'Test0',
          uid: 'Test0[0]',
        },
        {
          type: 'Bar',
          properties: { baz: 1 },
          flags: { required: [], disallowed: ['bar'] },
          pluginID: 'Test0',
          pluginName: 'Test0',
          uid: 'Test0[1]',
        },
      ]);

      const dynamicPluginExtensions1: Extension[] = [
        { type: 'Qux', properties: { value: 'test' }, flags: { required: ['foo', 'bar'] } },
      ];

      const dynamicPluginExtensions2: Extension[] = [
        { type: 'Mux', properties: {}, flags: { required: ['foo'], disallowed: ['bar'] } },
      ];

      store.addDynamicPlugin(
        'Test1@1.2.3',
        getPluginManifest('Test1', '1.2.3', dynamicPluginExtensions1),
        dynamicPluginExtensions1,
      );

      store.addDynamicPlugin(
        'Test2@2.3.4',
        getPluginManifest('Test2', '2.3.4', dynamicPluginExtensions2),
        dynamicPluginExtensions2,
      );

      store.setDynamicPluginEnabled('Test1@1.2.3', true);
      store.setDynamicPluginEnabled('Test2@2.3.4', true);

      expect(store.getAllExtensions()).toEqual([
        {
          type: 'Foo',
          properties: { test: true },
          flags: { required: ['foo'], disallowed: [] },
          pluginID: 'Test0',
          pluginName: 'Test0',
          uid: 'Test0[0]',
        },
        {
          type: 'Bar',
          properties: { baz: 1 },
          flags: { required: [], disallowed: ['bar'] },
          pluginID: 'Test0',
          pluginName: 'Test0',
          uid: 'Test0[1]',
        },
        {
          type: 'Qux',
          properties: { value: 'test' },
          flags: { required: ['foo', 'bar'], disallowed: [] },
          pluginID: 'Test1@1.2.3',
          pluginName: 'Test1',
          uid: 'Test1@1.2.3[0]',
        },
        {
          type: 'Mux',
          properties: {},
          flags: { required: ['foo'], disallowed: ['bar'] },
          pluginID: 'Test2@2.3.4',
          pluginName: 'Test2',
          uid: 'Test2@2.3.4[0]',
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
      const store = new PluginStore([], new Set(['Test']));
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);
      store.setDynamicPluginEnabled('Test@1.2.3', true);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(2);
        expect(l.mock.calls).toEqual([[], []]);
      });
    });
  });

  describe('addDynamicPlugin', () => {
    it('adds the given plugin into loadedDynamicPlugins', () => {
      const store = new PluginStore([], new Set(['Test']));

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

      store.addDynamicPlugin('Test@1.2.3', manifest, resolvedExtensions);

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

      expect(store.getAllExtensions()).toEqual([]);
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
      const store = new PluginStore([], new Set(['Test']));
      const manifest1 = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);
      const manifest2 = getPluginManifest('Test', '1.2.3', [{ type: 'Bar', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest1, [{ type: 'Foo', properties: {} }]);
      store.addDynamicPlugin('Test@1.2.3', manifest2, [{ type: 'Bar', properties: {} }]);

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
      const store = new PluginStore([], new Set(['Test1', 'Test2']));
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.size).toBe(0);
    });

    it('does nothing if the plugin is already marked as failed', () => {
      const store = new PluginStore([], new Set(['Test']));
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.registerFailedDynamicPlugin('Test');
      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.size).toBe(0);
    });
  });

  describe('setDynamicPluginEnabled', () => {
    it('recomputes dynamic extensions and calls all registered listeners', () => {
      const store = new PluginStore([], new Set(['Test1', 'Test2']));
      const manifest1 = getPluginManifest('Test1', '1.2.3', [{ type: 'Foo', properties: {} }]);
      const manifest2 = getPluginManifest('Test2', '2.3.4', [{ type: 'Bar', properties: {} }]);

      store.addDynamicPlugin('Test1@1.2.3', manifest1, [{ type: 'Foo', properties: {} }]);
      store.addDynamicPlugin('Test2@2.3.4', manifest2, [{ type: 'Bar', properties: {} }]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      expect(loadedDynamicPlugins.get('Test1@1.2.3').enabled).toBe(false);
      expect(loadedDynamicPlugins.get('Test2@2.3.4').enabled).toBe(false);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('Test1@1.2.3', true);

      expect(loadedDynamicPlugins.get('Test1@1.2.3').enabled).toBe(true);
      expect(loadedDynamicPlugins.get('Test2@2.3.4').enabled).toBe(false);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([
        {
          type: 'Foo',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'Test1@1.2.3',
          pluginName: 'Test1',
          uid: 'Test1@1.2.3[0]',
        },
      ]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
      });

      store.setDynamicPluginEnabled('Test2@2.3.4', true);

      expect(loadedDynamicPlugins.get('Test1@1.2.3').enabled).toBe(true);
      expect(loadedDynamicPlugins.get('Test2@2.3.4').enabled).toBe(true);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([
        {
          type: 'Foo',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'Test1@1.2.3',
          pluginName: 'Test1',
          uid: 'Test1@1.2.3[0]',
        },
        {
          type: 'Bar',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'Test2@2.3.4',
          pluginName: 'Test2',
          uid: 'Test2@2.3.4[0]',
        },
      ]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(2);
      });

      store.setDynamicPluginEnabled('Test1@1.2.3', false);

      expect(loadedDynamicPlugins.get('Test1@1.2.3').enabled).toBe(false);
      expect(loadedDynamicPlugins.get('Test2@2.3.4').enabled).toBe(true);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions).toEqual([
        {
          type: 'Bar',
          properties: {},
          flags: { required: [], disallowed: [] },
          pluginID: 'Test2@2.3.4',
          pluginName: 'Test2',
          uid: 'Test2@2.3.4[0]',
        },
      ]);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(3);
      });
    });

    it('does nothing if the plugin is not loaded', () => {
      const store = new PluginStore([], new Set(['Test']));
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      const { loadedDynamicPlugins } = store.getStateForTestPurposes();

      store.setDynamicPluginEnabled('Test1@1.2.3', true);

      expect(loadedDynamicPlugins.get('Test@1.2.3').enabled).toBe(false);
      expect(store.getStateForTestPurposes().dynamicPluginExtensions.length).toBe(0);

      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });
    });

    it('does nothing if the plugin is already enabled or disabled', () => {
      const store = new PluginStore([], new Set(['Test']));
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

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
      const store = new PluginStore([], new Set(['Test']));

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
      const store = new PluginStore([], new Set(['Test1', 'Test2']));

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
      const store = new PluginStore([], new Set(['Test']));
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

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
      const store = new PluginStore([], new Set(['Test1', 'Test2']));
      const manifest1 = getPluginManifest('Test1', '1.2.3', [{ type: 'Foo', properties: {} }]);

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Pending',
          pluginName: 'Test1',
        },
        {
          status: 'Pending',
          pluginName: 'Test2',
        },
      ]);

      store.addDynamicPlugin('Test1@1.2.3', manifest1, [{ type: 'Foo', properties: {} }]);

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Loaded',
          pluginID: 'Test1@1.2.3',
          metadata: _.omit(manifest1, 'extensions'),
          enabled: false,
        },
        {
          status: 'Pending',
          pluginName: 'Test2',
        },
      ]);

      store.setDynamicPluginEnabled('Test1@1.2.3', true);

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Loaded',
          pluginID: 'Test1@1.2.3',
          metadata: _.omit(manifest1, 'extensions'),
          enabled: true,
        },
        {
          status: 'Pending',
          pluginName: 'Test2',
        },
      ]);

      store.registerFailedDynamicPlugin('Test2');

      expect(store.getDynamicPluginInfo()).toEqual([
        {
          status: 'Loaded',
          pluginID: 'Test1@1.2.3',
          metadata: _.omit(manifest1, 'extensions'),
          enabled: true,
        },
        {
          status: 'Failed',
          pluginName: 'Test2',
        },
      ]);
    });
  });
});
