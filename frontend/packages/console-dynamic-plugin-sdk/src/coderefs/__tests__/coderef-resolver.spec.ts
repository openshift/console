import * as _ from 'lodash';
import {
  applyCodeRefSymbol,
  isEncodedCodeRef,
  isExecutableCodeRef,
  filterEncodedCodeRefProperties,
  filterExecutableCodeRefProperties,
  mergeExtensionProperties,
  parseEncodedCodeRefValue,
  loadReferencedObject,
  resolveEncodedCodeRefs,
  resolveCodeRefProperties,
  resolveExtension,
} from '../coderef-resolver';
import { Extension, EncodedCodeRef, CodeRef } from '../../types';
import {
  getExecutableCodeRefMock,
  getEntryModuleMocks,
  ModuleFactoryMock,
  RemoteEntryModuleMock,
} from '../../utils/test-utils';

describe('applyCodeRefSymbol', () => {
  it('marks the given function with CodeRef symbol', () => {
    const ref: CodeRef = () => Promise.resolve('qux');
    expect(isExecutableCodeRef(ref)).toBe(false);

    const updatedRef = applyCodeRefSymbol(ref);
    expect(isExecutableCodeRef(updatedRef)).toBe(true);
  });

  it('returns the same function instance', () => {
    const ref: CodeRef = () => Promise.resolve('qux');
    expect(applyCodeRefSymbol(ref)).toBe(ref);
  });
});

describe('isEncodedCodeRef', () => {
  it('returns true if obj is structured as { $codeRef: string }', () => {
    expect(isEncodedCodeRef({})).toBe(false);
    expect(isEncodedCodeRef({ $codeRef: true })).toBe(false);
    expect(isEncodedCodeRef({ $codeRef: 'foo' })).toBe(true);
    expect(isEncodedCodeRef({ $codeRef: 'foo', bar: true })).toBe(false);
  });
});

describe('isExecutableCodeRef', () => {
  it('returns true if obj is a function marked with CodeRef symbol', () => {
    expect(isExecutableCodeRef(() => {})).toBe(false);
    expect(isExecutableCodeRef(getExecutableCodeRefMock('qux'))).toBe(true);
    expect(isExecutableCodeRef(applyCodeRefSymbol(() => Promise.resolve('qux')))).toBe(true);
  });
});

describe('filterEncodedCodeRefProperties', () => {
  it('picks properties whose values match isEncodedCodeRef predicate', () => {
    expect(
      filterEncodedCodeRefProperties({
        foo: { $codeRef: 'foo' },
        bar: ['test'],
        baz: () => {},
        qux: getExecutableCodeRefMock('qux'),
      }),
    ).toEqual({
      foo: { $codeRef: 'foo' },
    });
  });
});

describe('filterExecutableCodeRefProperties', () => {
  it('picks properties whose values match isExecutableCodeRef predicate', () => {
    const ref = getExecutableCodeRefMock('qux');

    expect(
      filterExecutableCodeRefProperties({
        foo: { $codeRef: 'foo' },
        bar: ['test'],
        baz: () => {},
        qux: ref,
      }),
    ).toEqual({
      qux: ref,
    });
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

describe('parseEncodedCodeRefValue', () => {
  it('returns [moduleName, exportName] tuple if value has the right format', () => {
    expect(parseEncodedCodeRefValue('foo.bar')).toEqual(['foo', 'bar']);
    expect(parseEncodedCodeRefValue('foo')).toEqual(['foo', 'default']);
  });

  it('returns an empty array if value does not have the expected format', () => {
    expect(parseEncodedCodeRefValue('')).toEqual([]);
    expect(parseEncodedCodeRefValue('.')).toEqual([]);
    expect(parseEncodedCodeRefValue('.bar')).toEqual([]);
    expect(parseEncodedCodeRefValue('.bar.')).toEqual([]);
  });
});

describe('loadReferencedObject', () => {
  const testResult = async (
    ref: EncodedCodeRef,
    requestedModule: {},
    beforeResult: (entryModule: RemoteEntryModuleMock, moduleFactory: ModuleFactoryMock) => void,
    afterResult: (
      result: any,
      errorCallback: jest.Mock<void>,
      entryModule: RemoteEntryModuleMock,
      moduleFactory: ModuleFactoryMock,
    ) => void,
  ) => {
    const errorCallback = jest.fn<void>();
    const [moduleFactory, entryModule] = getEntryModuleMocks(requestedModule);
    beforeResult(entryModule, moduleFactory);

    const result = await loadReferencedObject(ref, entryModule, 'Test@1.2.3', errorCallback);
    afterResult(result, errorCallback, entryModule, moduleFactory);
  };

  it('returns the referenced object via remote entry module', async () => {
    await testResult(
      { $codeRef: 'foo.bar' },
      { bar: 'value1', default: 'value2' },
      _.noop,
      (result, errorCallback, entryModule, moduleFactory) => {
        expect(result).toBe('value1');
        expect(errorCallback).not.toHaveBeenCalled();
        expect(entryModule.get).toHaveBeenCalledWith('foo');
        expect(moduleFactory).toHaveBeenCalledWith();
      },
    );

    await testResult(
      { $codeRef: 'foo' },
      { bar: 'value1', default: 'value2' },
      _.noop,
      (result, errorCallback, entryModule, moduleFactory) => {
        expect(result).toBe('value2');
        expect(errorCallback).not.toHaveBeenCalled();
        expect(entryModule.get).toHaveBeenCalledWith('foo');
        expect(moduleFactory).toHaveBeenCalledWith();
      },
    );
  });

  it('fails on malformed code reference', async () => {
    await testResult(
      { $codeRef: '' },
      { bar: 'value1', default: 'value2' },
      _.noop,
      (result, errorCallback, entryModule, moduleFactory) => {
        expect(result).toBe(null);
        expect(errorCallback).toHaveBeenCalledWith();
        expect(entryModule.get).not.toHaveBeenCalled();
        expect(moduleFactory).not.toHaveBeenCalled();
      },
    );
  });

  it('fails when requested module resolution throws an error', async () => {
    await testResult(
      { $codeRef: 'foo.bar' },
      { bar: 'value1', default: 'value2' },
      (entryModule) => {
        entryModule.get.mockImplementation(() => {
          throw new Error('boom');
        });
      },
      (result, errorCallback, entryModule, moduleFactory) => {
        expect(result).toBe(null);
        expect(errorCallback).toHaveBeenCalledWith();
        expect(entryModule.get).toHaveBeenCalledWith('foo');
        expect(moduleFactory).not.toHaveBeenCalled();
      },
    );

    await testResult(
      { $codeRef: 'foo.bar' },
      { bar: 'value1', default: 'value2' },
      (entryModule, moduleFactory) => {
        moduleFactory.mockImplementation(() => {
          throw new Error('boom');
        });
      },
      (result, errorCallback, entryModule, moduleFactory) => {
        expect(result).toBe(null);
        expect(errorCallback).toHaveBeenCalledWith();
        expect(entryModule.get).toHaveBeenCalledWith('foo');
        expect(moduleFactory).toHaveBeenCalledWith();
      },
    );
  });

  it('fails on missing module export', async () => {
    await testResult(
      { $codeRef: 'foo.bar' },
      { default: 'value2' },
      _.noop,
      (result, errorCallback, entryModule, moduleFactory) => {
        expect(result).toBe(null);
        expect(errorCallback).toHaveBeenCalledWith();
        expect(entryModule.get).toHaveBeenCalledWith('foo');
        expect(moduleFactory).toHaveBeenCalledWith();
      },
    );
  });
});

describe('resolveEncodedCodeRefs', () => {
  it('replaces encoded code references with CodeRef functions', () => {
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

    const errorCallback = jest.fn();
    const [, entryModule] = getEntryModuleMocks({ b: 'value' });

    const resolvedExtensions = resolveEncodedCodeRefs(
      extensions,
      entryModule,
      'Test@1.2.3',
      errorCallback,
    );

    expect(resolvedExtensions.length).toBe(extensions.length);
    expect(resolvedExtensions[0]).toEqual(extensions[0]);

    expect(_.omit(resolvedExtensions[1], 'properties.qux')).toEqual(
      _.omit(extensions[1], 'properties.qux'),
    );

    expect(isExecutableCodeRef(resolvedExtensions[1].properties.qux)).toBe(true);
  });
});

describe('resolveCodeRefProperties', () => {
  it('replaces CodeRef functions with referenced objects', async () => {
    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: { test: true },
      },
      {
        type: 'Bar',
        properties: { baz: 1, qux: getExecutableCodeRefMock('value') },
      },
    ];

    expect(await resolveCodeRefProperties(extensions[0])).toEqual({ test: true });
    expect(await resolveCodeRefProperties(extensions[1])).toEqual({ baz: 1, qux: 'value' });
  });
});

describe('resolveExtension', () => {
  it('returns an extension with CodeRef functions replaced with referenced objects', async () => {
    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: { test: true },
      },
      {
        type: 'Bar',
        properties: { baz: 1, qux: getExecutableCodeRefMock('value') },
      },
    ];

    expect(await resolveExtension(extensions[0])).toEqual({
      type: 'Foo',
      properties: { test: true },
    });
    expect(await resolveExtension(extensions[1])).toEqual({
      type: 'Bar',
      properties: { baz: 1, qux: 'value' },
    });
  });

  it('returns a new extension instance', async () => {
    const testExtension: Extension = { type: 'Foo/Bar', properties: {} };
    const resolvedExtension = await resolveExtension(testExtension);

    expect(resolvedExtension).not.toBe(testExtension);
    expect(Object.isFrozen(resolvedExtension)).toBe(true);
  });
});
