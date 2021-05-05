import { SupportedExtension } from '../schema/console-extensions';
import { ConsolePluginMetadata } from '../schema/plugin-package';
import { applyCodeRefSymbol } from '../coderefs/coderef-resolver';
import { CodeRef } from '../types';

export type ExtensionProvider = (
  filePath: string,
  exposedModules: ConsolePluginMetadata['exposedModules'],
) => SupportedExtension[];

export type ConsoleExtensions = SupportedExtension[];

/**
 * This is used to create and identify code references within `console-extensions.ts` files.
 */
export const codeRef = <T>(value: T): CodeRef<T> =>
  applyCodeRefSymbol(() => Promise.resolve(value));
