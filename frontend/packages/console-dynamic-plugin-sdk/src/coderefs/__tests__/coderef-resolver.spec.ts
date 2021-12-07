import * as _ from 'lodash';
import { Extension, EncodedCodeRef, CodeRef } from '../../types';
import {
  getExecutableCodeRefMock,
  getEntryModuleMocks,
  ModuleFactoryMock,
  RemoteEntryModuleMock,
} from '../../utils/test-utils';
import {
  applyCodeRefSymbol,
  isEncodedCodeRef,
  isExecutableCodeRef,
  parseEncodedCodeRefValue,
  loadReferencedObject,
  resolveEncodedCodeRefs,
  resolveExtension,
  isCodeRefError,
} from '../coderef-resolver';

const getErrorExecutableCodeRefMock = <T = any>(): jest.Mock<ReturnType<CodeRef<T>>> => {
  const ref = jest.fn(() => Promise.reject(new Error()));
  applyCodeRefSymbol<T>(ref);
  return ref;
};

const originalConsole = { ...console };
const consoleMock = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = consoleMock));
});

afterEach(() => {
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = originalConsole[key]));
});

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
        expect(consoleMock).toHaveBeenCalledWith(
          "Malformed code reference '' of plugin Test@1.2.3",
        );
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
        expect(consoleMock).toHaveBeenCalledWith(
          "Failed to load module 'foo' of plugin Test@1.2.3",
          expect.any(Error),
        );
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
        expect(consoleMock).toHaveBeenCalledWith(
          "Failed to load module 'foo' of plugin Test@1.2.3",
          expect.any(Error),
        );
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
        expect(consoleMock).toHaveBeenCalledWith(
          "Missing module export 'foo.bar' of plugin Test@1.2.3",
        );
      },
    );
  });
});

describe('resolveEncodedCodeRefs', () => {
  it('replaces encoded code references with CodeRef functions', async () => {
    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: {
          test: true,
          qux: { $codeRef: 'mod.a' },
        },
      },
      {
        type: 'Bar',
        properties: {
          test: [1],
          baz: { test: { $codeRef: 'mod.b' } },
        },
      },
    ];

    const errorCallback = jest.fn();
    const [, entryModule] = getEntryModuleMocks({ a: 'value1', b: 'value2' });

    const resolvedExtensions = resolveEncodedCodeRefs(
      extensions,
      entryModule,
      'Test@1.2.3',
      errorCallback,
    );

    expect(resolvedExtensions.length).toBe(extensions.length);

    expect(resolvedExtensions[0].properties.test).toBe(true);
    expect(isExecutableCodeRef(resolvedExtensions[0].properties.qux)).toBe(true);
    expect(await resolvedExtensions[0].properties.qux()).toBe('value1');

    expect(resolvedExtensions[1].properties.test).toEqual([1]);
    expect(isExecutableCodeRef(resolvedExtensions[1].properties.baz.test)).toBe(true);
    expect(await resolvedExtensions[1].properties.baz.test()).toBe('value2');
  });

  it('clones the provided extensions array and its elements', () => {
    const extensions: Extension[] = [
      { type: 'Foo', properties: { test: true } },
      { type: 'Bar', properties: { test: [1] } },
    ];

    const errorCallback = jest.fn();
    const [, entryModule] = getEntryModuleMocks({});

    const resolvedExtensions = resolveEncodedCodeRefs(
      extensions,
      entryModule,
      'Test@1.2.3',
      errorCallback,
    );

    expect(resolvedExtensions).not.toBe(extensions);
    expect(resolvedExtensions).toEqual(extensions);

    resolvedExtensions.forEach((e, index) => {
      expect(e).not.toBe(extensions[index]);
      expect(e).toEqual(extensions[index]);
    });
  });
});

describe('resolveExtension', () => {
  it('replaces CodeRef functions with referenced objects', async () => {
    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: {
          test: true,
          qux: getExecutableCodeRefMock('value1'),
        },
      },
      {
        type: 'Bar',
        properties: {
          test: [1],
          baz: { test: getExecutableCodeRefMock('value2') },
        },
      },
    ];

    expect(await resolveExtension(extensions[0])).toEqual({
      type: 'Foo',
      properties: {
        test: true,
        qux: 'value1',
      },
    });

    expect(await resolveExtension(extensions[1])).toEqual({
      type: 'Bar',
      properties: {
        test: [1],
        baz: { test: 'value2' },
      },
    });
  });

  it('returns the same extension instance', async () => {
    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: { test: true },
      },
      {
        type: 'Foo',
        properties: { test: true, qux: getExecutableCodeRefMock('value1') },
      },
    ];

    expect(await resolveExtension(extensions[0])).toBe(extensions[0]);
    expect(await resolveExtension(extensions[1])).toBe(extensions[1]);
  });

  it('continuously reject code refs which have failed to resolve', async () => {
    const errorCodeRef = getErrorExecutableCodeRefMock();

    const extension: Extension = {
      type: 'Foo',
      properties: { test: true, qux: errorCodeRef },
    };

    expect(isCodeRefError(errorCodeRef)).toBe(false);
    await resolveExtension(extension);
    expect(isCodeRefError(errorCodeRef)).toBe(true);
    expect(errorCodeRef).toHaveBeenCalledTimes(1);

    await resolveExtension(extension);
    expect(isCodeRefError(errorCodeRef)).toBe(true);
    expect(errorCodeRef).toHaveBeenCalledTimes(1);
  });
});
