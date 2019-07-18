/**
 * An extension of the Console application.
 *
 * Each extension is a realization (instance) of an extension `type` using the
 * parameters provided via the `properties` object.
 *
 * The value of extension `type` should be formatted in a way that describes
 * the broader category as well as any specialization(s), for example:
 *
 * - `ModelDefinition`
 * - `NavItem/Href`
 * - `Dashboards/Overview/Utilization`
 *
 * Each extension may specify `flags` representing Console feature flags which
 * are required and/or disallowed in order to put this extension into effect.
 * At runtime, the `flags` object is automatically expanded based on extensions
 * that add new feature flags.
 *
 * TODO(vojtech): write ESLint rule to guard against extension type duplicity
 */
export type Extension<P = any> = {
  type: string;
  properties: P;
  flags?: Partial<{
    required: string[];
    disallowed: string[];
  }>;
};

/**
 * An extension that is always on, regardless of feature flags.
 *
 * In addition, always-on extensions are expected to be contributed by plugins
 * at build time. _They are not expected to be added dynamically at runtime._
 */
export type AlwaysOnExtension<P = any> = Omit<Extension<P>, 'flags'>;

/**
 * From plugin author perspective, a plugin is simply a list of extensions.
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
export type Plugin<E extends Extension> = E[];

/**
 * From Console application perspective, a plugin is a list of extensions
 * enhanced with additional data.
 */
export type ActivePlugin = {
  name: string;
  extensions: Extension[];
};

export type LazyLoader<T extends {}> = () => Promise<React.ComponentType<Partial<T>>>;
