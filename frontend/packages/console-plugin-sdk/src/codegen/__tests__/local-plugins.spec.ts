import * as fs from 'fs';
import * as _ from 'lodash';
import { extensionsFile } from '@console/dynamic-plugin-sdk/src/constants';
import type { Extension, EncodedCodeRef } from '@console/dynamic-plugin-sdk/src/types';
import * as jsoncModule from '@console/dynamic-plugin-sdk/src/utils/jsonc';
import { ValidationResult } from '@console/dynamic-plugin-sdk/src/validation/ValidationResult';
import * as remotePluginModule from '@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin';
import { trimStartMultiLine } from '../../utils/string';
import { getTemplatePackage } from '../../utils/test-utils';
import * as localPluginsModule from '../local-plugins';
import { PluginPackage } from '../plugin-resolver';

jest.mock('@console/dynamic-plugin-sdk/src/utils/jsonc', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/jsonc'),
  parseJSONC: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin'),
  validateConsoleExtensionsFileSchema: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

const parseJSONC = jsoncModule.parseJSONC as jest.Mock;
const fsExistsSyncMock = fs.existsSync as jest.Mock;
const validateConsoleExtensionsFileSchema = remotePluginModule.validateConsoleExtensionsFileSchema as jest.Mock;

const {
  getLocalPluginsModule,
  loadLocalPluginsForTestPurposes,
  getExecutableCodeRefSource,
  getDynamicExtensions,
} = localPluginsModule;

beforeEach(() => {
  [parseJSONC, validateConsoleExtensionsFileSchema, fsExistsSyncMock].forEach((mock) =>
    mock.mockReset(),
  );
});

describe('getLocalPluginsModule', () => {
  it('returns module that exports the list of plugins based on pluginPackages', () => {
    const fooPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'foo',
      }),
      consolePlugin: {},
    };

    const barPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'bar-plugin',
      }),
      consolePlugin: {},
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
      getLocalPluginsModule([fooPluginPackage, barPluginPackage], moduleHook, extensionHook),
    ).toBe(
      trimStartMultiLine(
        `
        import { moduleHookTest } from '@console/test';
        moduleHookTest();

        const localPlugins = [];

        localPlugins.push({
          name: 'foo',
          version: '0.0.0',
          extensions: ${JSON.stringify(fooDynamicExtensions)},
          registrationMethod: 'local',
        });

        localPlugins.push({
          name: 'bar-plugin',
          version: '0.0.0',
          extensions: ${JSON.stringify(barDynamicExtensions)},
          registrationMethod: 'local',
        });

        export default localPlugins;
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

describe('loadLocalPluginsForTestPurposes', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('loads and returns the list of plugins based on pluginPackages', () => {
    const fooPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'foo',
      }),
      consolePlugin: {},
    };

    const barPluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'bar-plugin',
      }),
      consolePlugin: {},
    };

    const fooDynamicExtensions: Extension[] = [{ type: 'Dynamic/Foo', properties: { test: true } }];
    const barDynamicExtensions: Extension[] = [
      { type: 'Dynamic/Bar', properties: { baz: 1, qux: { $codeRef: 'a.b' } } },
    ];

    const moduleHook = jest.fn<void, []>();

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

    expect(
      loadLocalPluginsForTestPurposes(
        [fooPluginPackage, barPluginPackage],
        moduleHook,
        extensionHook,
      ),
    ).toEqual([
      {
        name: 'foo',
        version: '0.0.0',
        registrationMethod: 'local',
        extensions: fooDynamicExtensions,
      },
      {
        name: 'bar-plugin',
        version: '0.0.0',
        registrationMethod: 'local',
        extensions: barDynamicExtensions,
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
    consolePlugin: { exposedModules },
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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns an array of dynamic extensions with transformed code references', () => {
    const pluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'test-plugin',
      }),
      consolePlugin: {},
    };

    const extensionsJSON: Extension[] = [
      { type: 'Dynamic/Foo', properties: { test: true, mux: { $codeRef: 'a.b' } } },
      { type: 'Dynamic/Bar', properties: { baz: 1, qux: { $codeRef: 'foo.bar' } } },
    ];

    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string, [string]>(
      (codeRefSource) => `ref(${codeRefSource})`,
    );

    fsExistsSyncMock.mockImplementation(() => true);
    parseJSONC.mockImplementation(() => extensionsJSON);
    validateConsoleExtensionsFileSchema.mockImplementation(() => new ValidationResult('test'));

    const codeRefSourceGetter = jest.fn((ref: EncodedCodeRef) => {
      if (_.isEqual(ref, { $codeRef: 'a.b' })) {
        return "() => import('test-plugin/src/aaa.ts').then((m) => m.b)";
      }
      if (_.isEqual(ref, { $codeRef: 'foo.bar' })) {
        return "() => import('test-plugin/src/foo.ts').then((m) => m.bar)";
      }
      throw new Error('invalid mock arguments');
    });

    expect(
      getDynamicExtensions(
        pluginPackage,
        extensionsFilePath,
        errorCallback,
        codeRefTransformer,
        codeRefSourceGetter,
      ),
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

    expect(fsExistsSyncMock).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).toHaveBeenCalledWith(extensionsFilePath);
    expect(validateConsoleExtensionsFileSchema).toHaveBeenCalledWith(
      extensionsJSON,
      extensionsFilePath,
    );

    expect(codeRefSourceGetter.mock.calls.length).toBe(2);
    expect(codeRefSourceGetter.mock.calls[0]).toEqual([
      { $codeRef: 'a.b' },
      'mux',
      pluginPackage,
      expect.any(ValidationResult),
    ]);
    expect(codeRefSourceGetter.mock.calls[1]).toEqual([
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
      consolePlugin: {},
    };

    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string, [string]>(_.identity as (s: string) => string);
    const codeRefSourceGetter = jest.fn();

    fsExistsSyncMock.mockImplementation(() => false);

    expect(
      getDynamicExtensions(
        pluginPackage,
        extensionsFilePath,
        errorCallback,
        codeRefTransformer,
        codeRefSourceGetter,
      ),
    ).toBe('[]');

    expect(errorCallback).not.toHaveBeenCalled();
    expect(codeRefTransformer).not.toHaveBeenCalled();
    expect(fsExistsSyncMock).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).not.toHaveBeenCalled();
    expect(validateConsoleExtensionsFileSchema).not.toHaveBeenCalled();
    expect(codeRefSourceGetter).not.toHaveBeenCalled();
  });

  it('returns an empty array if the extensions file has schema validation errors', () => {
    const pluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'test-plugin',
      }),
      consolePlugin: {},
    };

    const extensionsJSON: Extension[] = [];
    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string, [string]>(_.identity as (s: string) => string);
    const getExecutableCodeRefSourceMock = jest.fn();

    fsExistsSyncMock.mockImplementation(() => true);
    parseJSONC.mockImplementation(() => extensionsJSON);
    validateConsoleExtensionsFileSchema.mockImplementation(() => {
      const result = new ValidationResult('test');
      result.addError('schema validation error');
      return result;
    });

    expect(
      getDynamicExtensions(
        pluginPackage,
        extensionsFilePath,
        errorCallback,
        codeRefTransformer,
        getExecutableCodeRefSourceMock,
      ),
    ).toBe('[]');

    expect(errorCallback).toHaveBeenCalledWith(expect.any(String));
    expect(codeRefTransformer).not.toHaveBeenCalled();
    expect(fsExistsSyncMock).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).toHaveBeenCalledWith(extensionsFilePath);
    expect(validateConsoleExtensionsFileSchema).toHaveBeenCalledWith(
      extensionsJSON,
      extensionsFilePath,
    );
    expect(getExecutableCodeRefSourceMock).not.toHaveBeenCalled();
  });

  it('returns an empty array when code reference transformation yields errors', () => {
    const pluginPackage: PluginPackage = {
      ...getTemplatePackage({
        name: 'test-plugin',
      }),
      consolePlugin: {},
    };

    const extensionsJSON: Extension[] = [
      { type: 'Dynamic/Foo', properties: { test: true, mux: { $codeRef: 'a.b' } } },
      { type: 'Dynamic/Bar', properties: { baz: 1, qux: { $codeRef: 'foo.bar' } } },
    ];

    const extensionsFilePath = `${pluginPackage._path}/${extensionsFile}`;
    const errorCallback = jest.fn();
    const codeRefTransformer = jest.fn<string, [string]>(_.identity as (s: string) => string);

    fsExistsSyncMock.mockImplementation(() => true);
    parseJSONC.mockImplementation(() => extensionsJSON);
    validateConsoleExtensionsFileSchema.mockImplementation(() => new ValidationResult('test'));

    const codeRefSourceGetter = jest.fn(
      (
        ref: EncodedCodeRef,
        _propName: string,
        _pkg: PluginPackage,
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
      getDynamicExtensions(
        pluginPackage,
        extensionsFilePath,
        errorCallback,
        codeRefTransformer,
        codeRefSourceGetter,
      ),
    ).toBe('[]');

    expect(errorCallback).toHaveBeenCalledWith(expect.any(String));

    expect(codeRefTransformer.mock.calls.length).toBe(2);
    expect(codeRefTransformer.mock.calls[0]).toEqual(['() => Promise.resolve(null)']);
    expect(codeRefTransformer.mock.calls[1]).toEqual([
      "() => import('test-plugin/src/foo.ts').then((m) => m.bar)",
    ]);

    expect(fsExistsSyncMock).toHaveBeenCalledWith(extensionsFilePath);
    expect(parseJSONC).toHaveBeenCalledWith(extensionsFilePath);
    expect(validateConsoleExtensionsFileSchema).toHaveBeenCalledWith(
      extensionsJSON,
      extensionsFilePath,
    );

    expect(codeRefSourceGetter.mock.calls.length).toBe(2);
    expect(codeRefSourceGetter.mock.calls[0]).toEqual([
      { $codeRef: 'a.b' },
      'mux',
      pluginPackage,
      expect.any(ValidationResult),
    ]);
    expect(codeRefSourceGetter.mock.calls[1]).toEqual([
      { $codeRef: 'foo.bar' },
      'qux',
      pluginPackage,
      expect.any(ValidationResult),
    ]);
  });
});
