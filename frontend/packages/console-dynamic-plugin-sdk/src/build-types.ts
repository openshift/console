import type {
  PluginBuildMetadata,
  RemotePluginManifest,
} from '@openshift/dynamic-plugin-sdk-webpack';
import type { PackageJson } from 'read-pkg';

/**
 * Note: this metadata should be supported in upstream plugin SDK.
 */
export type ExtraPluginBuildMetadata = Partial<{
  /** Plugin dependencies listed here will be treated as optional. */
  optionalDependencies: Record<string, string>;
}>;

export type ExtraPluginManifestProperties = ExtraPluginBuildMetadata;

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
export type ConsolePluginBuildMetadata = PluginBuildMetadata &
  ExtraPluginBuildMetadata &
  ConsoleSupportedCustomProperties;

/** The package.json for a Console plugin. */
export type ConsolePluginPackageJSON = PackageJson & {
  consolePlugin?: ConsolePluginBuildMetadata;
};

/**
 * Standard Console dynamic plugin manifest format.
 */
export type ConsolePluginManifest = {
  customProperties?: {
    console?: ConsoleSupportedCustomProperties;
    [customNamespace: string]: unknown;
  };
} & ExtraPluginManifestProperties &
  RemotePluginManifest;
