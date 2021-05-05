import { adaptExposedModulePaths } from '../webpack';

describe('adaptExposedModulePaths', () => {
  it('returns normalized file paths if contextDir is equal to pluginDir', () => {
    expect(
      adaptExposedModulePaths(
        {
          foo: './src/foo.ts',
          bar: 'src/utils/bar.ts',
          qux: 'src/../test/qux.ts',
        },
        '/test-plugin',
        '/test-plugin',
      ),
    ).toEqual({
      foo: './src/foo.ts',
      bar: './src/utils/bar.ts',
      qux: './test/qux.ts',
    });
  });

  it('returns relative normalized file paths if contextDir is not equal to pluginDir', () => {
    expect(
      adaptExposedModulePaths(
        {
          foo: './src/foo.ts',
          bar: 'src/utils/bar.ts',
          qux: 'src/../test/qux.ts',
        },
        '/test-plugin',
        '/test-plugin/src',
      ),
    ).toEqual({
      foo: './foo.ts',
      bar: './utils/bar.ts',
      qux: '../test/qux.ts',
    });
  });

  it('returns an empty object if exposedModules value is falsy', () => {
    expect(adaptExposedModulePaths({}, '/test-plugin')).toEqual({});
  });
});
