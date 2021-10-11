import * as webpack from 'webpack';
import { Extension } from '../../types';
import { collectCodeRefData, findWebpackModules, ExtensionValidator } from '../ExtensionValidator';
import { ValidationResult } from '../ValidationResult';

const getWebpackCompilationMocks = (
  webpackModules: {}[],
): [webpack.Compilation, jest.Mock<any>] => {
  const getProvidedExports = jest.fn();

  const compilation = {} as webpack.Compilation;
  compilation.modules = new Set();
  compilation.moduleGraph = { getProvidedExports } as any;

  webpackModules.forEach((m) => {
    compilation.modules.add(m as webpack.Module);
  });

  return [compilation, getProvidedExports];
};

describe('collectCodeRefData', () => {
  it('returns CodeRef data for the given list of extensions', () => {
    const extensions: Extension[] = [
      {
        type: 'Foo',
        properties: {
          test: true,
        },
      },
      {
        type: 'Bar',
        properties: {
          qux: { $codeRef: 'mod.a' },
          baz: { test: { $codeRef: 'mod.b' } },
        },
      },
    ];

    expect(collectCodeRefData(extensions)).toEqual([
      {
        index: 1,
        propToCodeRefValue: {
          qux: 'mod.a',
          test: 'mod.b',
        },
      },
    ]);
  });
});

describe('findWebpackModules', () => {
  it('maps plugin-exposed modules to webpack modules if they exist in compilation', () => {
    const [compilation] = getWebpackCompilationMocks([
      {}, // not a NormalModule
      { rawRequest: './foo' },
    ]);

    expect(findWebpackModules(compilation, { fooModule: './foo', barModule: './bar' })).toEqual({
      fooModule: { rawRequest: './foo' },
      barModule: undefined,
    });
  });
});

describe('ExtensionValidator', () => {
  describe('validate', () => {
    const testValidate = (
      extensions: Extension[],
      webpackModules: {}[],
      exposedModules: { [moduleName: string]: string },
      beforeResult: (getProvidedExports: jest.Mock<any>) => void,
      afterResult: (result: ValidationResult, getProvidedExports: jest.Mock<any>) => void,
    ) => {
      const [compilation, getProvidedExports] = getWebpackCompilationMocks(webpackModules);
      beforeResult(getProvidedExports);

      const result = new ExtensionValidator('test').validate(
        compilation,
        extensions,
        exposedModules,
        'testExtensions',
      );
      afterResult(result, getProvidedExports);
    };

    it('checks that each exposed module has at least one code reference', () => {
      testValidate(
        [
          {
            type: 'Foo',
            properties: { test: true },
          },
          {
            type: 'Bar',
            properties: { baz: 1, qux: { $codeRef: 'fooModule.fooExport' } },
          },
        ],
        [
          {}, // not a NormalModule
          { rawRequest: './foo' },
        ],
        {
          fooModule: './foo',
          barModule: './bar',
        },
        (getProvidedExports) => {
          getProvidedExports.mockImplementation((m) =>
            m.rawRequest === './foo' ? ['fooExport'] : [],
          );
        },
        (result, getProvidedExports) => {
          expect(result.getErrors().length).toBe(1);
          expect(result.getErrors()[0]).toBe(
            "Exposed module 'barModule' is not referenced by any extension",
          );
          expect(getProvidedExports).toHaveBeenCalledWith({ rawRequest: './foo' });
        },
      );
    });

    it('checks that each code reference points to a valid webpack module export', () => {
      testValidate(
        [
          {
            type: 'Foo',
            properties: { test: true },
          },
          {
            type: 'Bar',
            properties: {
              baz: 1,
              qux: { $codeRef: 'fooModule.fooExport' },
              mux: { $codeRef: '.fooExport' },
            },
          },
        ],
        [
          {}, // not a NormalModule
          { rawRequest: './foo' },
        ],
        {
          fooModule: './foo',
        },
        (getProvidedExports) => {
          getProvidedExports.mockImplementation((m) =>
            m.rawRequest === './foo' ? ['fooExport'] : [],
          );
        },
        (result, getProvidedExports) => {
          expect(result.getErrors().length).toBe(1);
          expect(result.getErrors()[0]).toBe(
            "Invalid code reference '.fooExport' in testExtensions[1] property 'mux'",
          );
          expect(getProvidedExports).toHaveBeenCalledTimes(1);
        },
      );

      testValidate(
        [
          {
            type: 'Foo',
            properties: { test: true },
          },
          {
            type: 'Bar',
            properties: {
              baz: 1,
              qux: { $codeRef: 'fooModule.fooExport' },
              mux: { $codeRef: 'barModule.barExport' },
            },
          },
        ],
        [
          {}, // not a NormalModule
          { rawRequest: './foo' },
        ],
        {
          fooModule: './foo',
        },
        (getProvidedExports) => {
          getProvidedExports.mockImplementation((m) =>
            m.rawRequest === './foo' ? ['fooExport'] : [],
          );
        },
        (result, getProvidedExports) => {
          expect(result.getErrors().length).toBe(1);
          expect(result.getErrors()[0]).toBe(
            "Invalid module 'barModule' in testExtensions[1] property 'mux'",
          );
          expect(getProvidedExports).toHaveBeenCalledTimes(1);
        },
      );

      testValidate(
        [
          {
            type: 'Foo',
            properties: { test: true },
          },
          {
            type: 'Bar',
            properties: {
              baz: 1,
              qux: { $codeRef: 'fooModule.fooExport' },
              mux: { $codeRef: 'fooModule.barExport' },
            },
          },
        ],
        [
          {}, // not a NormalModule
          { rawRequest: './foo' },
        ],
        {
          fooModule: './foo',
        },
        (getProvidedExports) => {
          getProvidedExports.mockImplementation((m) =>
            m.rawRequest === './foo' ? ['fooExport'] : [],
          );
        },
        (result, getProvidedExports) => {
          expect(result.getErrors().length).toBe(1);
          expect(result.getErrors()[0]).toBe(
            "Invalid module export 'barExport' in testExtensions[1] property 'mux'",
          );
          expect(getProvidedExports).toHaveBeenCalledTimes(2);
        },
      );
    });
  });
});
