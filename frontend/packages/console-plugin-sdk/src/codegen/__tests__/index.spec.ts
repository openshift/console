import {
  Package,
  PluginPackage,
  isPluginPackage,
  getActivePluginPackages,
  getActivePluginsModule,
} from '..';

const templatePackage: Package = { name: 'test', version: '1.2.3', readme: '', _id: '@' };

describe('codegen', () => {

  describe('isPluginPackage', () => {
    it('returns false if package.consolePlugin is missing', () => {
      expect(isPluginPackage({
        ...templatePackage,
      })).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is missing', () => {
      expect(isPluginPackage({
        ...templatePackage,
        consolePlugin: {},
      })).toBe(false);
    });

    it('returns false if package.consolePlugin.entry is an empty string', () => {
      expect(isPluginPackage({
        ...templatePackage,
        consolePlugin: { entry: '' },
      })).toBe(false);
    });

    it('returns true if package.consolePlugin.entry is a non-empty string', () => {
      expect(isPluginPackage({
        ...templatePackage,
        consolePlugin: { entry: 'plugin.ts' },
      })).toBe(true);
    });
  });

  describe('getActivePluginPackages', () => {
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

      expect(getActivePluginPackages(appPackage, pluginPackages)).toEqual([
        { ...pluginPackages[0] },
      ]);
    });
  });

  describe('getActivePluginsModule', () => {
    it('returns module source that exports the list of active plugins', () => {
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

      expect(getActivePluginsModule(pluginPackages)).toBe(`
        const activePlugins = [];

        import plugin_0 from 'bar/src/plugin.ts';
        activePlugins.push({ name: 'bar', extensions: plugin_0 });

        import plugin_1 from 'qux-plugin/index.ts';
        activePlugins.push({ name: 'qux-plugin', extensions: plugin_1 });

        export default activePlugins;
      `.replace(/^\s+/gm, ''));
    });
  });

});
