import * as readPkg from 'read-pkg';

import {
  Package,
  PluginPackage,
  isPluginPackage,
  readPackages,
  filterActivePluginPackages,
} from '../plugin-resolver';

export const templatePackage: Package = Object.freeze({
  name: 'test',
  version: '0.0.0',
  readme: '',
  _id: '@',
});

describe('plugin-resolver', () => {
  describe('isPluginPackage', () => {
    it('returns false if package.consolePlugin is missing', () => {
      expect(
        isPluginPackage({
          ...templatePackage,
        }),
      ).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is missing', () => {
      expect(
        isPluginPackage({
          ...templatePackage,
          consolePlugin: {},
        }),
      ).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is an empty string', () => {
      expect(
        isPluginPackage({
          ...templatePackage,
          consolePlugin: { entry: '' },
        }),
      ).toBe(false);
    });

    it('returns true if package.consolePlugin.entry is a non-empty string', () => {
      expect(
        isPluginPackage({
          ...templatePackage,
          consolePlugin: { entry: 'plugin.ts' },
        }),
      ).toBe(true);
    });
  });

  describe('readPackages', () => {
    let readPkgMock;

    beforeEach(() => {
      readPkgMock = jest.spyOn(readPkg, 'sync');
    });

    afterEach(() => {
      readPkgMock.mockRestore();
    });

    it('detects app and plugin packages by reading their metadata', () => {
      const appPackage: Package = {
        ...templatePackage,
        name: '@console/app',
      };

      const pluginPackage: PluginPackage = {
        ...templatePackage,
        name: '@console/foo-plugin',
        consolePlugin: { entry: 'plugin.ts' },
      };

      const utilsPackage: Package = {
        ...templatePackage,
        name: '@console/bar-utils',
      };

      readPkgMock.mockImplementation(
        ({ cwd }): Package => {
          if (cwd === '/test/packages/console-app') {
            return appPackage;
          }
          if (cwd === '/test/packages/foo-plugin') {
            return pluginPackage;
          }
          if (cwd === '/test/packages/bar-utils') {
            return utilsPackage;
          }
          throw new Error('invalid options');
        },
      );

      expect(
        readPackages([
          '/test/packages/console-app/package.json',
          '/test/packages/foo-plugin/package.json',
          '/test/packages/bar-utils/package.json',
        ]),
      ).toEqual({
        appPackage,
        pluginPackages: [pluginPackage],
      });
    });
  });

  describe('filterActivePluginPackages', () => {
    it('returns plugin packages listed in appPackage.dependencies', () => {
      const appPackage: Package = {
        ...templatePackage,
        name: 'app',
        dependencies: {
          foo: '0.1.2',
          bar: '1.2.3',
        },
      };

      const pluginPackages: PluginPackage[] = [
        {
          ...templatePackage,
          name: 'bar',
          version: '1.2.3',
          consolePlugin: { entry: 'plugin.ts' },
        },
        {
          ...templatePackage,
          name: 'qux',
          version: '2.3.4',
          consolePlugin: { entry: 'plugin.ts' },
        },
      ];

      expect(filterActivePluginPackages(appPackage, pluginPackages)).toEqual([pluginPackages[0]]);
    });

    it('should include appPackage as a valid plugin package', () => {
      const appPackage: PluginPackage = {
        ...templatePackage,
        name: 'app',
        dependencies: {},
        consolePlugin: { entry: 'plugin.ts' },
      };

      expect(filterActivePluginPackages(appPackage, [appPackage])).toEqual([appPackage]);
    });

    it('should return appPackage as the first plugin package', () => {
      const appPackage: PluginPackage = {
        ...templatePackage,
        name: 'app',
        dependencies: {
          bar: '1.2.3',
          qux: '2.3.4',
        },
        consolePlugin: { entry: 'plugin.ts' },
      };

      const pluginPackages: PluginPackage[] = [
        {
          ...templatePackage,
          name: 'bar',
          version: '1.2.3',
          consolePlugin: { entry: 'plugin.ts' },
        },
        {
          ...templatePackage,
          name: 'qux',
          version: '2.3.4',
          consolePlugin: { entry: 'plugin.ts' },
        },
      ];

      expect(filterActivePluginPackages(appPackage, [...pluginPackages, appPackage])).toEqual([
        appPackage,
        pluginPackages[0],
        pluginPackages[1],
      ]);
    });
  });
});
