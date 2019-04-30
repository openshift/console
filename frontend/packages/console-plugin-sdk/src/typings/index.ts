/**
 * An extension of the Console web application.
 *
 * Each extension is a realization (instance) of an extension `type` using the
 * parameters provided via the `properties` object.
 *
 * Core extension types should follow `Category` or `Category/Specialization`
 * format, e.g. `NavItem/Href`.
 *
 * @todo(vojtech) write ESLint rule to guard against extension type duplicity
 */
export interface Extension<P> {
  type: string;
  properties: P;
}

/**
 * A plugin is simply a list of extensions.
 *
 * Plugin metadata is stored in the `package.json` file of the corresponding
 * monorepo package. The `consolePlugin.entry` path should point to a module
 * that exports the plugin object.
 *
 * ```json
 *  {
 *    "name": "@console/demo-plugin",
 *    "version": "0.0.0-fixed",
 *    // scripts, dependencies, etc.
 *    "consolePlugin": {
 *      "entry": "src/plugin.ts"
 *    }
 *  }
 * ```
 *
 * For better type checking and code completion, use a type parameter that
 * represents the union of all the extension types consumed by the plugin:
 *
 * ```ts
 *  // packages/console-demo-plugin/src/plugin.ts
 *  import { Plugin } from '@console/plugin-sdk';
 *
 *  const plugin: Plugin<FooExtension | BarExtension> = [
 *    {
 *      type: 'Foo',
 *      properties: {} // Foo extension specific properties
 *    },
 *    {
 *      type: 'Bar',
 *      properties: {} // Bar extension specific properties
 *    }
 *  ];
 *
 *  export default plugin;
 * ```
 */
export type Plugin<E extends Extension<any>> = E[];

/**
 * A list of arbitrary plugins.
 */
export type PluginList = Plugin<Extension<any>>[];

// TODO(vojtech): internal code needed by plugin SDK should be moved to console-shared package

export * from './features';
export * from './nav';
export * from './pages';
