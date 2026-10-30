import type { PluginBuildMetadata } from '@openshift/dynamic-plugin-sdk-webpack';
import type { PackageJson } from 'read-pkg';

/**
 * Additional plugin metadata supported by the Console application.
 */
export type ConsoleSupportedCustomProperties = Partial<{
  /** User-friendly plugin name. */
  displayName: string;

  /** User-friendly plugin description. */
  description: string;

  /** Disable the given static plugins when this plugin gets loaded. */
  disableStaticPlugins: string[];
}>;

/**
 * Build-time Console dynamic plugin metadata.
 */
export type ConsolePluginBuildMetadata = PluginBuildMetadata & ConsoleSupportedCustomProperties;

/**
 * Console dynamic plugin `package.json` file.
 */
export type ConsolePluginPackageJSON = PackageJson & {
  consolePlugin?: ConsolePluginBuildMetadata;
};

/**
 * Describes the `meta/shared-modules.json` file containing shared modules and their supported versions.
 */
export interface ConsolePluginSharedModuleVersions {
  /** Console provided shared modules: singleton no-fallback modules to be used by all plugins. */
  console: PackageJson['dependencies'];
  /** Shared dynamic modules: PatternFly packages that support `dist/dynamic` module structure. */
  dynamic: PackageJson['dependencies'];
};
