import { SupportedExtension } from './console-extensions';
import { ConsolePluginMetadata } from './plugin-package';

/**
 * Schema of Console plugin's `plugin-manifest.json` file.
 */
export type ConsolePluginManifestJSON = Omit<ConsolePluginMetadata, 'exposedModules'> & {
  /** List of extensions contributed by the plugin. */
  extensions: SupportedExtension[];
};
