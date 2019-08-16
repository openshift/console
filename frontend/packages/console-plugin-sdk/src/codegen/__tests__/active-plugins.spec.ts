import { Plugin, HrefNavItem } from '../../typings';
import { loadActivePlugins } from '../active-plugins';
import { templatePackage } from './plugin-resolver.spec';

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
            },
          },
        },
      ];

      jest.doMock('foo/src/plugin.ts', () => ({ default: fooPlugin }), { virtual: true });
      jest.doMock('bar-plugin/index.ts', () => ({ default: barPlugin }), { virtual: true });

      expect(
        loadActivePlugins([
          {
            ...templatePackage,
            name: 'foo',
            consolePlugin: { entry: 'src/plugin.ts' },
          },
          {
            ...templatePackage,
            name: 'bar-plugin',
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
});
