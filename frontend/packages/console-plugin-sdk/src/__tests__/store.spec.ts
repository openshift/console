import * as _ from 'lodash';
import * as Combinatorics from 'js-combinatorics';
import { PodModel } from '@console/internal/models';
import { Extension, ModelDefinition } from '../typings';
import {
  sanitizeExtension,
  augmentExtension,
  isExtensionInUse,
  getGatingFlagNames,
} from '../store';

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
