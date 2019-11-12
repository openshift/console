import * as _ from 'lodash';
import * as Combinatorics from 'js-combinatorics';
import { PodModel } from '@console/internal/models';
import { Extension, ActivePlugin, FeatureFlag, ModelDefinition, YAMLTemplate } from '../typings';
import {
  isAlwaysOnExtension,
  isGatedExtension,
  sanitizeExtension,
  augmentExtension,
  isExtensionInUse,
  collectFlags,
  getGatingFlagNames,
} from '../store';

const featureFlag: FeatureFlag = Object.freeze({
  type: 'FeatureFlag/Model',
  properties: {
    flag: 'FOO',
    model: PodModel,
  },
});

const modelDefinition: ModelDefinition = Object.freeze({
  type: 'ModelDefinition',
  properties: {
    models: [PodModel],
  },
});

const yamlTemplate: YAMLTemplate = Object.freeze({
  type: 'YAMLTemplate',
  properties: {
    model: PodModel,
    template: 'foo',
  },
});

describe('isAlwaysOnExtension & isGatedExtension', () => {
  it('only FeatureFlag and ModelDefinition extensions are considered always-on', () => {
    expect(isAlwaysOnExtension(featureFlag)).toBe(true);
    expect(isGatedExtension(featureFlag)).toBe(false);

    expect(isAlwaysOnExtension(modelDefinition)).toBe(true);
    expect(isGatedExtension(modelDefinition)).toBe(false);

    expect(isAlwaysOnExtension(yamlTemplate)).toBe(false);
    expect(isGatedExtension(yamlTemplate)).toBe(true);

    expect(isAlwaysOnExtension({ type: 'Foo/Bar', properties: {} })).toBe(false);
    expect(isGatedExtension({ type: 'Foo/Bar', properties: {} })).toBe(true);
  });
});

describe('sanitizeExtension', () => {
  it('sanitizes the flags object for gated extensions', () => {
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
  });

  it('deletes the flags object for always-on extensions', () => {
    const featureFlagClone = _.clone(featureFlag);
    (featureFlagClone as Extension).flags = {};

    expect(sanitizeExtension(featureFlagClone)).toEqual(featureFlag);
  });

  it('returns the same extension instance', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };

    expect(sanitizeExtension(testExtension)).toBe(testExtension);
  });
});

describe('augmentExtension', () => {
  const testPlugin: ActivePlugin = Object.freeze({
    name: 'Test',
    extensions: [],
  });

  it('adds the plugin property', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };

    expect(augmentExtension(testExtension, testPlugin)).toEqual({
      type: 'Foo/Bar',
      properties: {},
      plugin: testPlugin.name,
    });
  });

  it('returns the same extension instance', () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };

    expect(augmentExtension(testExtension, testPlugin)).toBe(testExtension);
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

  it('returns true only when all flags are resolved to the right values', () => {
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

describe('collectFlags', () => {
  const getRequiredFlags = (extensionFlags: Extension['flags']) => extensionFlags.required;
  const getDisallowedFlags = (extensionFlags: Extension['flags']) => extensionFlags.disallowed;

  it('returns an empty array for always-on extensions', () => {
    const extensions: (FeatureFlag | ModelDefinition)[] = [
      {
        type: 'FeatureFlag/Model',
        properties: {
          flag: 'FOO',
          model: PodModel,
        },
      },
      {
        type: 'ModelDefinition',
        properties: {
          models: [PodModel],
        },
      },
    ];

    expect(collectFlags(extensions, getRequiredFlags)).toEqual([]);
    expect(collectFlags(extensions, getDisallowedFlags)).toEqual([]);
  });

  it('returns a flattened array for gated extensions', () => {
    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: {},
        flags: {
          required: ['foo', 'bar'],
          disallowed: [],
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
    ];

    expect(collectFlags(extensions, getRequiredFlags)).toEqual(['foo', 'bar', 'baz']);
    expect(collectFlags(extensions, getDisallowedFlags)).toEqual(['qux', 'test']);
  });
});

describe('getGatingFlagNames', () => {
  it('returns an array of relevant feature flag names', () => {
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
          disallowed: [],
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
    ];

    expect(getGatingFlagNames(extensions)).toEqual(['foo', 'bar', 'baz', 'qux', 'test']);
  });
});
