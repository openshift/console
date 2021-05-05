import * as fs from 'fs';
import * as providerDelegateModule from '../provider-delegate';
import { Extension } from '../../types';

const getSupportedExtensionFiles = jest.spyOn(providerDelegateModule, 'getSupportedExtensionFiles');

const { parseConsoleExtensions } = providerDelegateModule;

beforeEach(() => {
  getSupportedExtensionFiles.mockReset();
});

describe('parseConsoleExtensions', () => {
  let fsExistsSync: jest.SpyInstance<typeof fs.existsSync>;

  beforeEach(() => {
    fsExistsSync = jest.spyOn(fs, 'existsSync');
  });

  afterEach(() => {
    fsExistsSync.mockRestore();
  });

  it('returns an object containing parsed Console extensions', () => {
    const parsedExtensions: Extension[] = [
      {
        type: 'Foo',
        properties: { test: true },
      },
      {
        type: 'Bar',
        properties: { baz: 1, qux: { $codeRef: 'a.b' } },
      },
    ];

    const exposedModules = { a: './a' };

    const fooExtensionProvider = jest.fn(() => parsedExtensions);
    const barExtensionProvider = jest.fn();

    getSupportedExtensionFiles.mockImplementation(() => [
      {
        fileName: 'ext.foo',
        provider: fooExtensionProvider,
      },
      {
        fileName: 'ext.bar',
        provider: barExtensionProvider,
      },
    ]);

    fsExistsSync.mockImplementation((filePath) => filePath === '/test-plugin/ext.foo');

    expect(parseConsoleExtensions('/test-plugin', exposedModules)).toEqual({
      extensions: parsedExtensions,
      extensionsFilePath: '/test-plugin/ext.foo',
    });

    expect(fsExistsSync.mock.calls.length).toBe(2);
    expect(fsExistsSync.mock.calls[0]).toEqual(['/test-plugin/ext.foo']);
    expect(fsExistsSync.mock.calls[1]).toEqual(['/test-plugin/ext.bar']);

    expect(fooExtensionProvider).toHaveBeenCalledWith('/test-plugin/ext.foo', exposedModules);
    expect(barExtensionProvider).not.toHaveBeenCalled();
  });

  it('throws an error if no extensions files are found', () => {
    const fooExtensionProvider = jest.fn();
    const barExtensionProvider = jest.fn();

    getSupportedExtensionFiles.mockImplementation(() => [
      {
        fileName: 'ext.foo',
        provider: fooExtensionProvider,
      },
      {
        fileName: 'ext.bar',
        provider: barExtensionProvider,
      },
    ]);

    fsExistsSync.mockImplementation(() => false);

    expect(() => {
      parseConsoleExtensions('/test-plugin', {});
    }).toThrow();

    expect(fsExistsSync.mock.calls.length).toBe(2);
    expect(fsExistsSync.mock.calls[0]).toEqual(['/test-plugin/ext.foo']);
    expect(fsExistsSync.mock.calls[1]).toEqual(['/test-plugin/ext.bar']);

    expect(fooExtensionProvider).not.toHaveBeenCalled();
    expect(barExtensionProvider).not.toHaveBeenCalled();
  });

  it('throws an error if multiple extensions files are found', () => {
    const fooExtensionProvider = jest.fn();
    const barExtensionProvider = jest.fn();

    getSupportedExtensionFiles.mockImplementation(() => [
      {
        fileName: 'ext.foo',
        provider: fooExtensionProvider,
      },
      {
        fileName: 'ext.bar',
        provider: barExtensionProvider,
      },
    ]);

    fsExistsSync.mockImplementation((filePath) =>
      ['/test-plugin/ext.foo', '/test-plugin/ext.bar'].includes(filePath),
    );

    expect(() => {
      parseConsoleExtensions('/test-plugin', {});
    }).toThrow();

    expect(fsExistsSync.mock.calls.length).toBe(2);
    expect(fsExistsSync.mock.calls[0]).toEqual(['/test-plugin/ext.foo']);
    expect(fsExistsSync.mock.calls[1]).toEqual(['/test-plugin/ext.bar']);

    expect(fooExtensionProvider).not.toHaveBeenCalled();
    expect(barExtensionProvider).not.toHaveBeenCalled();
  });

  it('throws an error if there are problems while parsing an extensions file', () => {
    const exposedModules = { a: './a' };

    const fooExtensionProvider = jest.fn(() => {
      throw new Error('boom');
    });

    const barExtensionProvider = jest.fn();

    getSupportedExtensionFiles.mockImplementation(() => [
      {
        fileName: 'ext.foo',
        provider: fooExtensionProvider,
      },
      {
        fileName: 'ext.bar',
        provider: barExtensionProvider,
      },
    ]);

    fsExistsSync.mockImplementation((filePath) => filePath === '/test-plugin/ext.foo');

    expect(() => {
      parseConsoleExtensions('/test-plugin', exposedModules);
    }).toThrow();

    expect(fsExistsSync.mock.calls.length).toBe(2);
    expect(fsExistsSync.mock.calls[0]).toEqual(['/test-plugin/ext.foo']);
    expect(fsExistsSync.mock.calls[1]).toEqual(['/test-plugin/ext.bar']);

    expect(fooExtensionProvider).toHaveBeenCalledWith('/test-plugin/ext.foo', exposedModules);
    expect(barExtensionProvider).not.toHaveBeenCalled();
  });
});
