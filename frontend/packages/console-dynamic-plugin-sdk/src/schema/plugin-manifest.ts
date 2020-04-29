import { ConsolePluginMetadata } from './plugin-package';
import { SupportedExtension } from './console-extensions';

/**
 * Schema of Console plugin's `plugin-manifest.json` file.
 */
export type ConsolePluginManifestJSON = {
  /** Plugin name (unique identifier), e.g. `kubevirt`. */
  name: string;
  /** Plugin version (semver compliant), e.g. `1.2.3`. */
  version: string;
  /** List of extensions contributed by the plugin. */
  extensions: SupportedExtension[];
} & Omit<ConsolePluginMetadata, 'exposedModules'>;
