import {
  Package,
  PluginPackage,
  isValidPluginPackage,
  resolveActivePlugins,
  getActivePluginsModule,
} from '..';

const templatePackage: Package = { name: 'test', version: '1.2.3', readme: '', _id: '@' };

describe('codegen', () => {

  describe('isValidPluginPackage', () => {
    it('returns false if package.consolePlugin is missing', () => {
      expect(isValidPluginPackage({
        ...templatePackage,
      })).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is missing', () => {
      expect(isValidPluginPackage({
        ...templatePackage,
        consolePlugin: {},
      })).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is an empty string', () => {
      expect(isValidPluginPackage({
        ...templatePackage,
        consolePlugin: { entry: '' },
      })).toBe(false);
    });

    it('returns true if package.consolePlugin.entry is not an empty string', () => {
      expect(isValidPluginPackage({
        ...templatePackage,
        consolePlugin: { entry: 'plugin.ts' },
      })).toBe(true);
    });
  });

  describe('resolveActivePlugins', () => {
    it('filters out packages which are not listed in appPackage.dependencies', () => {
      const appPackage: Package = {
        ...templatePackage,
        name: 'app',
        dependencies: {
          'foo': '0.1.2',
          'bar': '1.2.3',
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

      expect(resolveActivePlugins(appPackage, pluginPackages)).toEqual([
        { ...pluginPackages[0] },
      ]);
    });
  });

  describe('getActivePluginsModule', () => {
    it('returns the source of a module that exports the list of active plugins', () => {
      const pluginPackages: PluginPackage[] = [
        {
          ...templatePackage,
          name: 'bar',
          version: '1.2.3',
          consolePlugin: { entry: 'src/plugin.ts' },
        },
        {
          ...templatePackage,
          name: 'qux-plugin',
          version: '2.3.4',
          consolePlugin: { entry: 'index.ts' },
        },
      ];

      const expectedModule = `
        const activePlugins = [];
        import plugin_0 from 'bar/src/plugin.ts';
        activePlugins.push(plugin_0);
        import plugin_1 from 'qux-plugin/index.ts';
        activePlugins.push(plugin_1);
        export default activePlugins;
      `.replace(/^\s+/gm, '');

      expect(getActivePluginsModule(pluginPackages)).toBe(expectedModule);
    });
  });

});
