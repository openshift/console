import * as fs from 'fs';
import * as _ from 'lodash';
import { extensionsFile } from '@console/dynamic-plugin-sdk/src/constants';
import { EncodedCodeRef } from '@console/dynamic-plugin-sdk/src/types';
import * as jsoncModule from '@console/dynamic-plugin-sdk/src/utils/jsonc';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import * as assetPluginModule from '@console/dynamic-plugin-sdk/src/webpack/ConsoleAssetPlugin';
import { Extension } from '../../typings';
import { trimStartMultiLine } from '../../utils/string';
import { getTemplatePackage } from '../../utils/test-utils';
import * as activePluginsModule from '../active-plugins';
import { PluginPackage } from '../plugin-resolver';

const parseJSONC = jest.spyOn(jsoncModule, 'parseJSONC');
const validateExtensionsFileSchema = jest.spyOn(assetPluginModule, 'validateExtensionsFileSchema');

const {
  getActivePluginsModule,
  loadActivePluginsForTestPurposes,
  getExecutableCodeRefSource,
  getDynamicExtensions,
} = activePluginsModule;

beforeEach(() => {
  [parseJSONC, validateExtensionsFileSchema].forEach((mock) => mock.mockReset());
});

describe('getActivePluginsModule', () => {
  it('returns module that exports the list of plugins based on pluginPackages', () => {
    const fooPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'foo',
      }),
      consolePlugin: { entry: 'src/plugin.ts' },
    };

    const barPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'bar-plugin',
      }),
      consolePlugin: { entry: 'index.ts' },
    };

    const fooDynamicExtensions: Extension[] = [{ type: 'Dynamic/Foo', properties: { test: true } }];
    const barDynamicExtensions: Extension[] = [
      { type: 'Dynamic/Bar', properties: { baz: 1, qux: { $codeRef: 'a.b' } } },
    ];

    const moduleHook = jest.fn(
      () => `
      import { moduleHookTest } from '@console/test';
      moduleHookTest();
      `,
    );

    const extensionHook = jest.fn((pkg: PluginPackage) => {
      switch (pkg) {
        case fooPluginPackage:
          return JSON.stringify(fooDynamicExtensions);
        case barPluginPackage:
          return JSON.stringify(barDynamicExtensions);
        default:
          throw new Error('invalid arguments');
      }
    });

    expect(
      getActivePluginsModule([fooPluginPackage, barPluginPackage], moduleHook, extensionHook),
    ).toBe(
      trimStartMultiLine(
        `
        import { moduleHookTest } from '@console/test';
        moduleHookTest();

        const activePlugins = [];

        activePlugins.push({
          name: 'foo',
          extensions: [
            ...require('foo/src/plugin.ts').default,
            ...${JSON.stringify(fooDynamicExtensions)},
          ],
        });

        activePlugins.push({
          name: 'bar-plugin',
          extensions: [
            ...require('bar-plugin/index.ts').default,
            ...${JSON.stringify(barDynamicExtensions)},
          ],
        });

        export default activePlugins;
        `,
      ),
    );

    expect(moduleHook.mock.calls.length).toBe(1);
    expect(moduleHook.mock.calls[0]).toEqual([]);

    expect(extensionHook.mock.calls.length).toBe(2);
    expect(extensionHook.mock.calls[0]).toEqual([fooPluginPackage]);
    expect(extensionHook.mock.calls[1]).toEqual([barPluginPackage]);
  });
});

describe('loadActivePluginsForTestPurposes', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('loads and returns the list of plugins based on pluginPackages', () => {
    const fooPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'foo',
      }),
      consolePlugin: { entry: 'src/plugin.ts' },
    };

    const barPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'bar-plugin',
      }),
      consolePlugin: { entry: 'index.ts' },
    };

    const fooStaticExtensions: Extension[] = [{ type: 'Static/Foo', properties: { test: true } }];
    const barStaticExtensions: Extension[] = [
      { type: 'Static/Bar', properties: { baz: 1, qux: () => true } },
    ];

    const fooDynamicExtensions: Extension[] = [{ type: 'Dynamic/Foo', properties: { test: true } }];
    const barDynamicExtensions: Extension[] = [
      { type: 'Dynamic/Bar', properties: { baz: 1, qux: { $codeRef: 'a.b' } } },
    ];

    const moduleHook = jest.fn<void>();

    const extensionHook = jest.fn((pkg: PluginPackage) => {
      switch (pkg) {
        case fooPluginPackage:
          return fooDynamicExtensions;
        case barPluginPackage:
          return barDynamicExtensions;
        default:
          throw new Error('invalid arguments');
      }
    });

    jest.doMock('foo/src/plugin.ts', () => ({ default: fooStaticExtensions }), { virtual: true });
    jest.doMock('bar-plugin/index.ts', () => ({ default: barStaticExtensions }), { virtual: true });

    expect(
      loadActivePluginsForTestPurposes(
        [fooPluginPackage, barPluginPackage],
        moduleHook,
        extensionHook,
      ),
    ).toEqual([
      {
        name: 'foo',
        extensions: [...fooStaticExtensions, ...fooDynamicExtensions],
      },
      {
        name: 'bar-plugin',
        extensions: [...barStaticExtensions, ...barDynamicExtensions],
      },
    ]);

    expect(moduleHook.mock.calls.length).toBe(1);
    expect(moduleHook.mock.calls[0]).toEqual([]);

    expect(extensionHook.mock.calls.length).toBe(2);
    expect(extensionHook.mock.calls[0]).toEqual([fooPluginPackage]);
    expect(extensionHook.mock.calls[1]).toEqual([barPluginPackage]);
  });
});

describe('getExecutableCodeRefSource', () => {
  const getPluginPackage = (
    name: string,
    exposedModules: { [moduleName: string]: string } = {},
  ): PluginPackage => ({
    ...getTemplatePackage({ name }),
    consolePlugin: { entry: 'src/plugin.ts', exposedModules },
  });

  it('transforms encoded code reference into CodeRef function source', () => {
    const validationResult = new ValidationResult('test');

    expect(
      getExecutableCodeRefSource(
        { $codeRef: 'foo.bar' },
        'qux',
        getPluginPackage('test-plugin', { foo: 'src/foo.ts' }),
        validationResult,
      ),
    ).toBe(
      "() => import('test-plugin/src/foo.ts' /* webpackChunkName: 'test-plugin/code-refs/foo' */).then((m) => m.bar)",
    );

    expect(validationResult.hasErrors()).toBe(false);

    expect(
      getExecutableCodeRefSource(
        { $codeRef: 'foo.bar' },
        'qux',
        getPluginPackage('@console/test-plugin', { foo: 'src/foo.ts' }),
        validationResult,
      ),
    ).toBe(
      "() => import('@console/test-plugin/src/foo.ts' /* webpackChunkName: 'test-plugin/code-refs/foo' */).then((m) => m.bar)",
    );

    expect(validationResult.hasErrors()).toBe(false);
  });

  it('fails on malformed code reference', () => {
    const validationResult = new ValidationResult('test');

    expect(
      getExecutableCodeRefSource(
        { $codeRef: '.bar' },
        'qux',
        getPluginPackage('test-plugin'),
        validationResult,
      ),
    ).toBe('() => Promise.resolve(null)');

    expect(validationResult.getErrors().length).toBe(1);
    expect(validationResult.getErrors()[0]).toBe("Invalid code reference '.bar' in property 'qux'");
  });

  it('fails when requested module is not exposed by the plugin', () => {
    const validationResult = new ValidationResult('test');

    expect(
      getExecutableCodeRefSource(
        { $codeRef: 'foo.bar' },
        'qux',
        getPluginPackage('test-plugin'),
        validationResult,
      ),
    ).toBe('() => Promise.resolve(null)');

    expect(validationResult.getErrors().length).toBe(1);
    expect(validationResult.getErrors()[0]).toBe("Module 'foo' is not exposed in property 'qux'");
  });
});

describe('getDynamicExtensions', () => {
  let fsExistsSync: jest.SpyInstance<typeof fs.existsSync>;
  let getExecutableCodeRefSourceMock: jest.SpyInstance<typeof getExecutableCodeRefSource>;

  beforeEach(() => {
    fsExistsSync = jest.spyOn(fs, 'existsSync');
    getExecutableCodeRefSourceMock = jest.spyOn(activePluginsModule, 'getExecutableCodeRefSource');
  });

  afterEach(() => {
    [fsExistsSync, getExecutableCodeRefSourceMock].forEach((mock) => mock.mockRestore());
  });

  it('returns an array of dynamic extensions with transformed code references', () => {
    const pluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'test-plugin',
      }),
      consolePlugin: { entry: 'src/plugin.ts' },
    };

    const extensionsJSON: Extension[] = [
      { type: 'Dynamic/Foo', properties: { test: true, mux: { $codeRef: 'a.b' } } },
      { type: 'Dynamic/Bar', properties: { baz: 1, qux: { $codeRef: 'foo.bar' } } },
    ];

    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string>((codeRefSource) => `ref(${codeRefSource})`);

    fsExistsSync.mockImplementation(() => true);
    parseJSONC.mockImplementation(() => extensionsJSON);
    validateExtensionsFileSchema.mockImplementation(() => new ValidationResult('test'));

    getExecutableCodeRefSourceMock.mockImplementation((ref: EncodedCodeRef) => {
      if (_.isEqual(ref, { $codeRef: 'a.b' })) {
        return "() => import('test-plugin/src/aaa.ts').then((m) => m.b)";
      }
      if (_.isEqual(ref, { $codeRef: 'foo.bar' })) {
        return "() => import('test-plugin/src/foo.ts').then((m) => m.bar)";
      }
      throw new Error('invalid mock arguments');
    });

    expect(
      getDynamicExtensions(pluginPackage, extensionsFilePath, errorCallback, codeRefTransformer),
    ).toBe(
      trimStartMultiLine(
        `
        [
          {
            "type": "Dynamic/Foo",
            "properties": {
              "test": true,
              "mux": ref(() => import('test-plugin/src/aaa.ts').then((m) => m.b))
            }
          },
          {
            "type": "Dynamic/Bar",
            "properties": {
              "baz": 1,
              "qux": ref(() => import('test-plugin/src/foo.ts').then((m) => m.bar))
            }
          }
        ]`,
      ),
    );

    expect(errorCallback).not.toHaveBeenCalled();

    expect(codeRefTransformer.mock.calls.length).toBe(2);
    expect(codeRefTransformer.mock.calls[0]).toEqual([
      "() => import('test-plugin/src/aaa.ts').then((m) => m.b)",
    ]);
    expect(codeRefTransformer.mock.calls[1]).toEqual([
      "() => import('test-plugin/src/foo.ts').then((m) => m.bar)",
    ]);

    expect(fsExistsSync).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).toHaveBeenCalledWith(extensionsFilePath);
    expect(validateExtensionsFileSchema).toHaveBeenCalledWith(extensionsJSON, extensionsFilePath);

    expect(getExecutableCodeRefSourceMock.mock.calls.length).toBe(2);
    expect(getExecutableCodeRefSourceMock.mock.calls[0]).toEqual([
      { $codeRef: 'a.b' },
      'mux',
      pluginPackage,
      expect.any(ValidationResult),
    ]);
    expect(getExecutableCodeRefSourceMock.mock.calls[1]).toEqual([
      { $codeRef: 'foo.bar' },
      'qux',
      pluginPackage,
      expect.any(ValidationResult),
    ]);
  });

  it('returns an empty array if the extensions file is missing', () => {
    const pluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'test-plugin',
      }),
      consolePlugin: { entry: 'src/plugin.ts' },
    };

    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string>(_.identity);

    fsExistsSync.mockImplementation(() => false);

    expect(
      getDynamicExtensions(pluginPackage, extensionsFilePath, errorCallback, codeRefTransformer),
    ).toBe('[]');

    expect(errorCallback).not.toHaveBeenCalled();
    expect(codeRefTransformer).not.toHaveBeenCalled();
    expect(fsExistsSync).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).not.toHaveBeenCalled();
    expect(validateExtensionsFileSchema).not.toHaveBeenCalled();
    expect(getExecutableCodeRefSourceMock).not.toHaveBeenCalled();
  });

  it('returns an empty array if the extensions file has schema validation errors', () => {
    const pluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'test-plugin',
      }),
      consolePlugin: { entry: 'src/plugin.ts' },
    };

    const extensionsJSON: Extension[] = [];
    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string>(_.identity);

    fsExistsSync.mockImplementation(() => true);
    parseJSONC.mockImplementation(() => extensionsJSON);
    validateExtensionsFileSchema.mockImplementation(() => {
      const result = new ValidationResult('test');
      result.addError('schema validation error');
      return result;
    });

    expect(
      getDynamicExtensions(pluginPackage, extensionsFilePath, errorCallback, codeRefTransformer),
    ).toBe('[]');

    expect(errorCallback).toHaveBeenCalledWith(expect.any(String));
    expect(codeRefTransformer).not.toHaveBeenCalled();
    expect(fsExistsSync).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).toHaveBeenCalledWith(extensionsFilePath);
    expect(validateExtensionsFileSchema).toHaveBeenCalledWith(extensionsJSON, extensionsFilePath);
    expect(getExecutableCodeRefSourceMock).not.toHaveBeenCalled();
  });

  it('returns an empty array when code reference transformation yields errors', () => {
    const pluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'test-plugin',
      }),
      consolePlugin: { entry: 'src/plugin.ts' },
    };

    const extensionsJSON: Extension[] = [
      { type: 'Dynamic/Foo', properties: { test: true, mux: { $codeRef: 'a.b' } } },
      { type: 'Dynamic/Bar', properties: { baz: 1, qux: { $codeRef: 'foo.bar' } } },
    ];

    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string>(_.identity);

    fsExistsSync.mockImplementation(() => true);
    parseJSONC.mockImplementation(() => extensionsJSON);
    validateExtensionsFileSchema.mockImplementation(() => new ValidationResult('test'));

    getExecutableCodeRefSourceMock.mockImplementation(
      (
        ref: EncodedCodeRef,
        propName: string,
        pkg: PluginPackage,
        validationResult: ValidationResult,
      ) => {
        if (_.isEqual(ref, { $codeRef: 'a.b' })) {
          validationResult.addError('code reference transform error');
          return '() => Promise.resolve(null)';
        }
        if (_.isEqual(ref, { $codeRef: 'foo.bar' })) {
          return "() => import('test-plugin/src/foo.ts').then((m) => m.bar)";
        }
        throw new Error('invalid mock arguments');
      },
    );

    expect(
      getDynamicExtensions(pluginPackage, extensionsFilePath, errorCallback, codeRefTransformer),
    ).toBe('[]');

    expect(errorCallback).toHaveBeenCalledWith(expect.any(String));

    expect(codeRefTransformer.mock.calls.length).toBe(2);
    expect(codeRefTransformer.mock.calls[0]).toEqual(['() => Promise.resolve(null)']);
    expect(codeRefTransformer.mock.calls[1]).toEqual([
      "() => import('test-plugin/src/foo.ts').then((m) => m.bar)",
    ]);

    expect(fsExistsSync).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).toHaveBeenCalledWith(extensionsFilePath);
    expect(validateExtensionsFileSchema).toHaveBeenCalledWith(extensionsJSON, extensionsFilePath);

    expect(getExecutableCodeRefSourceMock.mock.calls.length).toBe(2);
    expect(getExecutableCodeRefSourceMock.mock.calls[0]).toEqual([
      { $codeRef: 'a.b' },
      'mux',
      pluginPackage,
      expect.any(ValidationResult),
    ]);
    expect(getExecutableCodeRefSourceMock.mock.calls[1]).toEqual([
      { $codeRef: 'foo.bar' },
      'qux',
      pluginPackage,
      expect.any(ValidationResult),
    ]);
  });
});
