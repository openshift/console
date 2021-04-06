import * as React from 'react';
import {
  ExtensionFlags,
  Extension,
  ExtensionTypeGuard,
  LoadedExtension,
} from '@console/dynamic-plugin-sdk/src/types';

export { ExtensionFlags, Extension, ExtensionTypeGuard, LoadedExtension };

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
