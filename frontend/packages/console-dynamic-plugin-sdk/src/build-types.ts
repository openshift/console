import type {
  PluginBuildMetadata,
  RemotePluginManifest,
} from '@openshift/dynamic-plugin-sdk-webpack';
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
 * Console dynamic plugin manifest, generated as part of the plugin's webpack build.
 */
// TODO(vojtech): globally extend customProperties type so that we can remove this type
export type ConsolePluginManifest = {
  customProperties?: {
    console?: ConsoleSupportedCustomProperties;
    [namespace: string]: unknown;
  };
} & RemotePluginManifest;
