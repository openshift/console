import { PluginPackage } from '../plugin-resolver';
import { getPluginIntegrationTestSuites } from '../plugin-integration-tests';
import { templatePackage } from './plugin-resolver.spec';

describe('getPluginIntegrationTestSuites', () => {
  it('will not fail on missing tests.', () => {
    const pluginPackages: PluginPackage[] = [
      {
        ...templatePackage,
        name: '@console/qux-plugin',
        version: '2.3.4',
        consolePlugin: { entry: 'plugin.ts' },
      },
    ];
    const expectedTests = {};

    expect(getPluginIntegrationTestSuites(pluginPackages)).toEqual(expectedTests);
  });

  it('returns a map of short-plugin-name to a list of its integration tests.', () => {
    const pluginPackages: PluginPackage[] = [
      {
        ...templatePackage,
        name: '@console/bar-plugin',
        version: '1.2.3',
        consolePlugin: {
          entry: 'plugin.ts',
          integrationTestSuites: {
            bar: [
              '@console/internal-integration-tests/tests/base.scenario.ts',
              './integration-tests/tests/bar.scenario.ts',
            ],
          },
        },
      },
      {
        ...templatePackage,
        name: '@console/foo-plugin',
        version: '1.2.3',
        consolePlugin: {
          entry: 'plugin.ts',
          integrationTestSuites: {
            foo: ['../foo-plugin/integration-tests/tests/foo.scenario.ts'],
          },
        },
      },
      {
        ...templatePackage,
        name: '@console/qux-plugin',
        version: '2.3.4',
        consolePlugin: { entry: 'plugin.ts' },
      },
    ];
    const expectedTests = {
      bar: [
        'tests/base.scenario.ts',
        '/test/packages/test-plugin/integration-tests/tests/bar.scenario.ts',
      ],
      foo: ['/test/packages/foo-plugin/integration-tests/tests/foo.scenario.ts'],
    };

    expect(getPluginIntegrationTestSuites(pluginPackages)).toEqual(expectedTests);
  });
});
