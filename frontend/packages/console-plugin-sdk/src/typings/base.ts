import * as React from 'react';
import { Extension } from '@console/dynamic-plugin-sdk/src/types';

export {
  Extension,
  ExtensionTypeGuard,
  LoadedExtension,
} from '@console/dynamic-plugin-sdk/src/types';

/**
 * An extension that is always effective, regardless of feature flags.
 */
// TODO(vojtech): remove; used only by static extension types
export type AlwaysOnExtension<P extends {} = any> = Omit<Extension<P>, 'flags'>;

/**
 * Console static plugin, represented as a list of extensions.
 */
// TODO(vojtech): remove; used only by static plugin entry modules
export type Plugin<E extends Extension> = E[];

/**
 * Common interface for loading async React components.
 */
// TODO(vojtech): remove; use CodeRef<React.ComponentType> instead
export type LazyLoader<T extends {} = {}> = () => Promise<React.ComponentType<Partial<T>>>;

/**
 * Runtime representation of a Console static plugin.
 */
export type ActivePlugin = {
  name: string;
  extensions: Extension[];
};
