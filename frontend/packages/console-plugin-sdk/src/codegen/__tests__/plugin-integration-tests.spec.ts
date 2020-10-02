import * as glob from 'glob';
import { PluginPackage } from '../plugin-resolver';
import { getTestSuitesForPluginPackage, mergeTestSuites } from '../plugin-integration-tests';
import { getTemplatePackage } from './plugin-resolver.spec';

describe('plugin-integration-tests', () => {
  describe('getTestSuitesForPluginPackage', () => {
    let globMock: jest.SpyInstance<typeof glob.sync>;

    beforeEach(() => {
      globMock = jest.spyOn(glob, 'sync');
    });

    afterEach(() => {
      globMock.mockRestore();
    });

    it('returns an empty object if package.consolePlugin.integrationTestSuites is missing', () => {
      expect(
        getTestSuitesForPluginPackage(
          {
            ...getTemplatePackage(),
            consolePlugin: { entry: 'plugin.ts' },
          },
          '/test/packages/console-app',
        ),
      ).toEqual({});
    });

    it('maps package.consolePlugin.integrationTestSuites to an object with relative paths', () => {
      const pluginPackage: PluginPackage = {
        ...getTemplatePackage({
          _path: '/test/packages/test-plugin',
        }),
        consolePlugin: {
          entry: 'plugin.ts',
          integrationTestSuites: {
            'foo-bar': ['integration-tests/**/*.scenario.ts'],
            'demo-suite': ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
          },
        },
      };

      globMock.mockImplementation((pattern: string) => {
        if (pattern === 'integration-tests/**/*.scenario.ts') {
          return [
            '/test/packages/test-plugin/integration-tests/tests/foo.scenario.ts',
            '/test/packages/test-plugin/integration-tests/tests/bar.scenario.ts',
          ];
        }
        if (pattern === '../demo-plugin/integration-tests/tests/demo.scenario.ts') {
          return ['/test/packages/demo-plugin/integration-tests/tests/demo.scenario.ts'];
        }
        throw new Error('invalid mock arguments');
      });

      expect(getTestSuitesForPluginPackage(pluginPackage, '/test/packages/console-app')).toEqual({
        'foo-bar': [
          '../test-plugin/integration-tests/tests/foo.scenario.ts',
          '../test-plugin/integration-tests/tests/bar.scenario.ts',
        ],
        'demo-suite': ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
      });

      expect(globMock).toHaveBeenCalledTimes(2);
      expect(globMock).toHaveBeenCalledWith(expect.any(String), {
        cwd: '/test/packages/test-plugin',
        absolute: true,
      });
    });
  });

  describe('mergeTestSuites', () => {
    it('merges object values as arrays', () => {
      expect(
        mergeTestSuites(
          {},
          {
            'foo-bar': [
              '../test-plugin/integration-tests/tests/foo.scenario.ts',
              '../test-plugin/integration-tests/tests/bar.scenario.ts',
            ],
            'demo-suite': ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
          },
        ),
      ).toEqual({
        'foo-bar': [
          '../test-plugin/integration-tests/tests/foo.scenario.ts',
          '../test-plugin/integration-tests/tests/bar.scenario.ts',
        ],
        'demo-suite': ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
      });

      expect(
        mergeTestSuites(
          {
            filter: ['integration-tests/tests/filter.scenario.ts'],
            all: [
              'integration-tests/tests/crud.scenario.ts',
              'integration-tests/tests/filter.scenario.ts',
            ],
          },
          {
            'foo-bar': [
              '../test-plugin/integration-tests/tests/foo.scenario.ts',
              '../test-plugin/integration-tests/tests/bar.scenario.ts',
            ],
            'demo-suite': ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
            all: ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
          },
        ),
      ).toEqual({
        filter: ['integration-tests/tests/filter.scenario.ts'],
        all: [
          'integration-tests/tests/crud.scenario.ts',
          'integration-tests/tests/filter.scenario.ts',
          '../demo-plugin/integration-tests/tests/demo.scenario.ts',
        ],
        'foo-bar': [
          '../test-plugin/integration-tests/tests/foo.scenario.ts',
          '../test-plugin/integration-tests/tests/bar.scenario.ts',
        ],
        'demo-suite': ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
      });
    });

    it('removes duplicate array elements', () => {
      expect(
        mergeTestSuites(
          {
            filter: [
              'integration-tests/tests/filter.scenario.ts',
              'integration-tests/tests/filter.scenario.ts',
            ],
          },
          {
            'foo-bar': [
              '../test-plugin/integration-tests/tests/foo.scenario.ts',
              '../test-plugin/integration-tests/tests/bar.scenario.ts',
              '../test-plugin/integration-tests/tests/foo.scenario.ts',
            ],
          },
        ),
      ).toEqual({
        filter: ['integration-tests/tests/filter.scenario.ts'],
        'foo-bar': [
          '../test-plugin/integration-tests/tests/foo.scenario.ts',
          '../test-plugin/integration-tests/tests/bar.scenario.ts',
        ],
      });
    });

    it('does not modify the original target object', () => {
      const target = {};
      const result = mergeTestSuites(target, {
        'demo-suite': ['../demo-plugin/integration-tests/tests/demo.scenario.ts'],
      });

      expect(target).toEqual({});
      expect(result).not.toBe(target);
    });
  });
});
