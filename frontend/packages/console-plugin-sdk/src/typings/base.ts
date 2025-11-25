import * as React from 'react';
import {
  ExtensionFlags,
  Extension,
  ExtensionTypeGuard,
  LoadedExtension,
} from '@console/dynamic-plugin-sdk/src/types';

export type { ExtensionFlags, Extension, ExtensionTypeGuard, LoadedExtension };

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
