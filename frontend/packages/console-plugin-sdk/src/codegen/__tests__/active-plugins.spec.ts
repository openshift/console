import { Plugin, HrefNavItem } from '../../typings';
import { loadActivePlugins, getActivePluginsModule } from '../active-plugins';
import { PluginPackage } from '../plugin-resolver';
import { getTemplatePackage } from './plugin-resolver.spec';

describe('active-plugins', () => {
  describe('loadActivePlugins', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it('loads the consolePlugin.entry module along with additional data', () => {
      const fooPlugin: Plugin<HrefNavItem> = [
        {
          type: 'NavItem/Href',
          properties: {
            componentProps: {
              name: 'Foo Link',
              href: '/foo',
              namespaced: false,
            },
          },
        },
      ];
      const barPlugin: Plugin<HrefNavItem> = [
        {
          type: 'NavItem/Href',
          properties: {
            componentProps: {
              name: 'Bar Link',
              href: '/bar',
              namespaced: false,
            },
          },
        },
      ];

      jest.doMock('foo/src/plugin.ts', () => ({ default: fooPlugin }), { virtual: true });
      jest.doMock('bar-plugin/index.ts', () => ({ default: barPlugin }), { virtual: true });

      expect(
        loadActivePlugins([
          {
            ...getTemplatePackage({
              name: 'foo',
            }),
            consolePlugin: { entry: 'src/plugin.ts' },
          },
          {
            ...getTemplatePackage({
              name: 'bar-plugin',
            }),
            consolePlugin: { entry: 'index.ts' },
          },
        ]),
      ).toEqual([
        {
          name: 'foo',
          extensions: fooPlugin,
        },
        {
          name: 'bar-plugin',
          extensions: barPlugin,
        },
      ]);
    });
  });

  describe('getActivePluginsModule', () => {
    it('returns module source that exports the list of active plugins', () => {
      const pluginPackages: PluginPackage[] = [
        {
          ...getTemplatePackage({
            name: 'foo',
          }),
          consolePlugin: { entry: 'src/plugin.ts' },
        },
        {
          ...getTemplatePackage({
            name: 'bar-plugin',
          }),
          consolePlugin: { entry: 'index.ts' },
        },
      ];

      expect(getActivePluginsModule(pluginPackages)).toBe(
        `
        const activePlugins = [];

        const plugin_0 = require('foo/src/plugin.ts').default;
        activePlugins.push({ name: 'foo', extensions: plugin_0 });

        const plugin_1 = require('bar-plugin/index.ts').default;
        activePlugins.push({ name: 'bar-plugin', extensions: plugin_1 });

        export default activePlugins;
        `.replace(/^\s+/gm, ''),
      );
    });
  });
});
