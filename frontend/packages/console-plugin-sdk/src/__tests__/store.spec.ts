import * as _ from 'lodash';
import * as Combinatorics from 'js-combinatorics';
import { PodModel } from '@console/internal/models';
import {
  getPluginManifest,
  getExecutableCodeRefMock,
} from '@console/dynamic-plugin-sdk/src/utils/test-utils';
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
  let debounce: jest.SpyInstance<typeof _.debounce>;

  beforeEach(() => {
    debounce = jest.spyOn(_, 'debounce');
    debounce.mockImplementation((func) => func);
  });

  afterEach(() => {
    debounce.mockRestore();
  });

  describe('constructor', () => {
    it('processes all plugins and stores their extensions in staticExtensions', () => {
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
        staticExtensions,
        dynamicExtensions,
        dynamicPlugins,
      } = store.getStateForTestPurposes();

      expect(staticExtensions).toEqual([
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

      staticExtensions.forEach((e) => {
        expect(Object.isFrozen(e)).toBe(true);
      });

      expect(dynamicExtensions).toEqual([]);
      expect(dynamicPlugins.size).toBe(0);

      expect(store.getAllExtensions()).toEqual(staticExtensions);
      expect(store.getDynamicPluginMetadata()).toEqual({});
    });
  });

  describe('getAllExtensions', () => {
    it('returns an aggregated list of static and dynamic extensions', () => {
      const store = new PluginStore([
        {
          name: 'Test0',
          extensions: [
            { type: 'Foo', properties: { test: true }, flags: { required: ['foo'] } },
            { type: 'Bar', properties: { baz: 1 }, flags: { disallowed: ['bar'] } },
          ],
        },
      ]);

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

      const dynamicExtensions1: Extension[] = [
        { type: 'Qux', properties: { value: 'test' }, flags: { required: ['foo', 'bar'] } },
      ];

      const dynamicExtensions2: Extension[] = [
        { type: 'Mux', properties: {}, flags: { required: ['foo'], disallowed: ['bar'] } },
      ];

      store.addDynamicPlugin(
        'Test1@1.2.3',
        getPluginManifest('Test1', '1.2.3', dynamicExtensions1),
        dynamicExtensions1,
      );

      store.addDynamicPlugin(
        'Test2@2.3.4',
        getPluginManifest('Test2', '2.3.4', dynamicExtensions2),
        dynamicExtensions2,
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
      const store = new PluginStore([]);

      expect(store.getStateForTestPurposes().listeners).toEqual([]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      expect(store.getStateForTestPurposes().listeners).toEqual(listeners);
    });

    it('returns a function to unsubscribe the given listener', () => {
      const store = new PluginStore([]);

      const listeners = [jest.fn(), jest.fn()];
      const unsubscribes = listeners.map((l) => store.subscribe(l));

      expect(store.getStateForTestPurposes().listeners).toEqual(listeners);

      unsubscribes.forEach((unsub) => {
        unsub();
      });

      expect(store.getStateForTestPurposes().listeners).toEqual([]);
    });

    it('causes the listener to be called when dynamicExtensions changes', () => {
      const store = new PluginStore([]);
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      expect(store.getStateForTestPurposes().dynamicExtensions.length).toBe(0);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('Test@1.2.3', true);

      expect(store.getStateForTestPurposes().dynamicExtensions.length).toBe(1);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
        expect(l.mock.calls[0]).toEqual([]);
      });
    });
  });

  describe('addDynamicPlugin', () => {
    it('processes the given plugin and stores its data in dynamicPlugins', () => {
      const store = new PluginStore([]);

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

      const {
        staticExtensions,
        dynamicExtensions,
        dynamicPlugins,
      } = store.getStateForTestPurposes();

      expect(staticExtensions).toEqual([]);
      expect(dynamicExtensions).toEqual([]);

      expect(dynamicPlugins.size).toBe(1);
      expect(dynamicPlugins.has('Test@1.2.3')).toBe(true);
      expect(dynamicPlugins.get('Test@1.2.3')).toEqual({
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

      const {
        manifest: testedManifest,
        processedExtensions: testedProcessedExtensions,
      } = dynamicPlugins.get('Test@1.2.3');

      expect(Object.isFrozen(testedManifest)).toBe(true);

      testedProcessedExtensions.forEach((e) => {
        expect(Object.isFrozen(e)).toBe(true);
      });

      expect(store.getAllExtensions()).toEqual([]);
      expect(store.getDynamicPluginMetadata()).toEqual({
        'Test@1.2.3': _.omit(manifest, 'extensions'),
      });
    });

    it('does nothing if a plugin with the same ID is already registered', () => {
      const store = new PluginStore([]);
      const manifest1 = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);
      const manifest2 = getPluginManifest('Test', '1.2.3', [{ type: 'Bar', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest1, [{ type: 'Foo', properties: {} }]);
      store.addDynamicPlugin('Test@1.2.3', manifest2, [{ type: 'Bar', properties: {} }]);

      const { dynamicPlugins } = store.getStateForTestPurposes();

      expect(dynamicPlugins.size).toBe(1);
      expect(dynamicPlugins.has('Test@1.2.3')).toBe(true);
      expect(dynamicPlugins.get('Test@1.2.3')).toEqual({
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
  });

  describe('setDynamicPluginEnabled', () => {
    it('recomputes dynamicExtensions and calls all registered listeners', () => {
      const store = new PluginStore([]);
      const manifest1 = getPluginManifest('Test1', '1.2.3', [{ type: 'Foo', properties: {} }]);
      const manifest2 = getPluginManifest('Test2', '2.3.4', [{ type: 'Bar', properties: {} }]);

      store.addDynamicPlugin('Test1@1.2.3', manifest1, [{ type: 'Foo', properties: {} }]);
      store.addDynamicPlugin('Test2@2.3.4', manifest2, [{ type: 'Bar', properties: {} }]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      expect(store.isDynamicPluginEnabled('Test1@1.2.3')).toBe(false);
      expect(store.isDynamicPluginEnabled('Test2@2.3.4')).toBe(false);
      expect(store.getStateForTestPurposes().dynamicExtensions).toEqual([]);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('Test1@1.2.3', true);

      expect(store.isDynamicPluginEnabled('Test1@1.2.3')).toBe(true);
      expect(store.isDynamicPluginEnabled('Test2@2.3.4')).toBe(false);
      expect(store.getStateForTestPurposes().dynamicExtensions).toEqual([
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

      expect(store.isDynamicPluginEnabled('Test1@1.2.3')).toBe(true);
      expect(store.isDynamicPluginEnabled('Test2@2.3.4')).toBe(true);
      expect(store.getStateForTestPurposes().dynamicExtensions).toEqual([
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

      expect(store.isDynamicPluginEnabled('Test1@1.2.3')).toBe(false);
      expect(store.isDynamicPluginEnabled('Test2@2.3.4')).toBe(true);
      expect(store.getStateForTestPurposes().dynamicExtensions).toEqual([
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

    it('does nothing if the plugin is already enabled or disabled', () => {
      const store = new PluginStore([]);
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      expect(store.isDynamicPluginEnabled('Test@1.2.3')).toBe(false);
      expect(store.getStateForTestPurposes().dynamicExtensions.length).toBe(0);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('Test@1.2.3', false);

      expect(store.isDynamicPluginEnabled('Test@1.2.3')).toBe(false);
      expect(store.getStateForTestPurposes().dynamicExtensions.length).toBe(0);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });

      store.setDynamicPluginEnabled('Test@1.2.3', true);

      expect(store.isDynamicPluginEnabled('Test@1.2.3')).toBe(true);
      expect(store.getStateForTestPurposes().dynamicExtensions.length).toBe(1);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
      });

      store.setDynamicPluginEnabled('Test@1.2.3', true);

      expect(store.isDynamicPluginEnabled('Test@1.2.3')).toBe(true);
      expect(store.getStateForTestPurposes().dynamicExtensions.length).toBe(1);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(1);
      });
    });

    it('does nothing if the plugin ID is not registered', () => {
      const store = new PluginStore([]);
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      const listeners = [jest.fn(), jest.fn()];
      listeners.forEach((l) => store.subscribe(l));

      store.setDynamicPluginEnabled('Test1@1.2.3', true);

      expect(store.isDynamicPluginEnabled('Test@1.2.3')).toBe(false);
      expect(store.getStateForTestPurposes().dynamicExtensions.length).toBe(0);
      listeners.forEach((l) => {
        expect(l.mock.calls.length).toBe(0);
      });
    });
  });

  describe('isDynamicPluginEnabled', () => {
    it('returns the enabled status for the given plugin', () => {
      const store = new PluginStore([]);
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      expect(store.isDynamicPluginEnabled('Test@1.2.3')).toBe(false);

      store.setDynamicPluginEnabled('Test@1.2.3', true);

      expect(store.isDynamicPluginEnabled('Test@1.2.3')).toBe(true);
    });

    it('returns false if the plugin ID is not registered', () => {
      const store = new PluginStore([]);
      const manifest = getPluginManifest('Test', '1.2.3', [{ type: 'Foo', properties: {} }]);

      store.addDynamicPlugin('Test@1.2.3', manifest, [{ type: 'Foo', properties: {} }]);

      expect(store.isDynamicPluginEnabled('Test1@1.2.3')).toBe(false);
    });
  });

  describe('getDynamicPluginMetadata', () => {
    it('returns metadata for all registered dynamic plugins', () => {
      const store = new PluginStore([]);
      const manifest1 = getPluginManifest('Test1', '1.2.3', [{ type: 'Foo', properties: {} }]);
      const manifest2 = getPluginManifest('Test2', '2.3.4', [{ type: 'Bar', properties: {} }]);

      expect(store.getDynamicPluginMetadata()).toEqual({});

      store.addDynamicPlugin('Test1@1.2.3', manifest1, [{ type: 'Foo', properties: {} }]);

      expect(store.getDynamicPluginMetadata()).toEqual({
        'Test1@1.2.3': _.omit(manifest1, 'extensions'),
      });

      store.addDynamicPlugin('Test2@2.3.4', manifest2, [{ type: 'Bar', properties: {} }]);

      expect(store.getDynamicPluginMetadata()).toEqual({
        'Test1@1.2.3': _.omit(manifest1, 'extensions'),
        'Test2@2.3.4': _.omit(manifest2, 'extensions'),
      });
    });
  });
});
