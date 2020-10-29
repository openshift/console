import * as path from 'path';
import * as fs from 'fs';
import * as findUp from 'find-up';
import * as readPkg from 'read-pkg';
import {
  Package,
  PluginPackage,
  isPluginPackage,
  readPackages,
  filterActivePluginPackages,
  getMonorepoRootDir,
} from '../plugin-resolver';

export const getTemplatePackage = ({
  name = 'test',
  version = '0.0.0',
  _path = '/test/packages/test-pkg',
} = {}): Package =>
  Object.freeze({
    name,
    version,
    readme: '',
    _id: `${name}@${version}`,
    _path,
  });

describe('plugin-resolver', () => {
  describe('isPluginPackage', () => {
    it('returns false if package.consolePlugin is missing', () => {
      expect(
        isPluginPackage({
          ...getTemplatePackage(),
        }),
      ).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is missing', () => {
      expect(
        isPluginPackage({
          ...getTemplatePackage(),
          consolePlugin: {},
        }),
      ).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is an empty string', () => {
      expect(
        isPluginPackage({
          ...getTemplatePackage(),
          consolePlugin: { entry: '' },
        }),
      ).toBe(false);
    });

    it('returns true if package.consolePlugin.entry is a non-empty string', () => {
      expect(
        isPluginPackage({
          ...getTemplatePackage(),
          consolePlugin: { entry: 'plugin.ts' },
        }),
      ).toBe(true);
    });
  });

  describe('readPackages', () => {
    let readPkgMock: jest.SpyInstance<typeof readPkg.sync>;

    beforeEach(() => {
      readPkgMock = jest.spyOn(readPkg, 'sync');
    });

    afterEach(() => {
      readPkgMock.mockRestore();
    });

    it('detects app and plugin packages by reading their metadata', () => {
      const appPackagePath = '/test/packages/console-app';
      const appPackage: Package = {
        ...getTemplatePackage({
          name: '@console/app',
          _path: appPackagePath,
        }),
      };

      const pluginPackagePath = '/test/packages/foo-plugin';
      const pluginPackage: PluginPackage = {
        ...getTemplatePackage({
          name: '@console/foo-plugin',
          _path: pluginPackagePath,
        }),
        consolePlugin: { entry: 'plugin.ts' },
      };

      const utilsPackagePath = '/test/packages/bar-utils';
      const utilsPackage: Package = {
        ...getTemplatePackage({
          name: '@console/bar-utils',
          _path: utilsPackagePath,
        }),
      };

      readPkgMock.mockImplementation(
        ({ cwd }): Package => {
          if (cwd === appPackagePath) {
            return appPackage;
          }
          if (cwd === pluginPackagePath) {
            return pluginPackage;
          }
          if (cwd === utilsPackagePath) {
            return utilsPackage;
          }
          throw new Error('invalid mock arguments');
        },
      );

      expect(
        readPackages([
          `${appPackagePath}/package.json`,
          `${pluginPackagePath}/package.json`,
          `${utilsPackagePath}/package.json`,
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
        ...getTemplatePackage({
          name: 'app',
        }),
        dependencies: {
          foo: '0.1.2',
          bar: '1.2.3',
        },
      };

      const pluginPackages: PluginPackage[] = [
        {
          ...getTemplatePackage({
            name: 'bar',
            version: '1.2.3',
          }),
          consolePlugin: { entry: 'plugin.ts' },
        },
        {
          ...getTemplatePackage({
            name: 'qux',
            version: '2.3.4',
          }),
          consolePlugin: { entry: 'plugin.ts' },
        },
      ];

      expect(filterActivePluginPackages(appPackage, pluginPackages)).toEqual([pluginPackages[0]]);
    });

    it('should include appPackage as a valid plugin package', () => {
      const appPackage: PluginPackage = {
        ...getTemplatePackage({
          name: 'app',
        }),
        dependencies: {},
        consolePlugin: { entry: 'plugin.ts' },
      };

      expect(filterActivePluginPackages(appPackage, [appPackage])).toEqual([appPackage]);
    });

    it('should return appPackage as the first plugin package', () => {
      const appPackage: PluginPackage = {
        ...getTemplatePackage({
          name: 'app',
        }),
        dependencies: {
          bar: '1.2.3',
          qux: '2.3.4',
        },
        consolePlugin: { entry: 'plugin.ts' },
      };

      const pluginPackages: PluginPackage[] = [
        {
          ...getTemplatePackage({
            name: 'bar',
            version: '1.2.3',
          }),
          consolePlugin: { entry: 'plugin.ts' },
        },
        {
          ...getTemplatePackage({
            name: 'qux',
            version: '2.3.4',
          }),
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

  describe('getMonorepoRootDir', () => {
    it('returns the location of Console monorepo root package', () => {
      const currentPackageFile = findUp.sync('package.json', {
        cwd: __dirname,
      });
      expect(fs.existsSync(currentPackageFile)).toBe(true);

      const parentPackageFile = findUp.sync('package.json', {
        cwd: path.join(path.dirname(currentPackageFile), '..'),
      });
      expect(fs.existsSync(parentPackageFile)).toBe(true);

      expect(getMonorepoRootDir()).toEqual(path.dirname(parentPackageFile));
    });
  });
});
