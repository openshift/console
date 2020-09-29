import * as React from 'react';

/**
 * Console feature flags used to gate extension instances.
 */
export type ExtensionFlags = Partial<{
  required: string[];
  disallowed: string[];
}>;

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
 * - `Page/Resource/List`
 * - `Dashboards/Overview/Utilization/Item`
 *
 * Each extension may specify `flags` referencing Console feature flags which
 * are required and/or disallowed in order to put this extension into effect.
 *
 * TODO(vojtech): write ESLint rule to guard against extension type duplicity
 */
export type Extension<P extends {} = any> = {
  type: string;
  properties: P;
  flags?: ExtensionFlags;
};

/**
 * An extension that is always effective, regardless of feature flags.
 */
export type AlwaysOnExtension<P extends {} = any> = Omit<Extension<P>, 'flags'>;

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
 * TS type guard to narrow type of the given extension to `E`.
 */
export type ExtensionTypeGuard<E extends Extension> = (e: E) => e is E;

/**
 * Common interface for loading async React components.
 */
export type LazyLoader<T extends {} = {}> = () => Promise<React.ComponentType<Partial<T>>>;

/**
 * From Console application perspective, a plugin is a list of extensions
 * enhanced with additional data.
 */
export type ActivePlugin = {
  name: string;
  extensions: Extension[];
};

/**
 * Runtime extension interface, exposing additional metadata.
 */
export type LoadedExtension<E extends Extension = Extension> = E & {
  pluginID: string;
  pluginName: string;
  uid: string;
};
