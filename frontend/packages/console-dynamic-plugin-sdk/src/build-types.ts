import { PluginBuildMetadata, PluginManifest } from '@openshift/dynamic-plugin-sdk-webpack';

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
 * Standard Console dynamic plugin manifest format.
 */
export type StandardConsolePluginManifest = {
  customProperties?: {
    console?: ConsoleSupportedCustomProperties;
    [customNamespace: string]: unknown;
  };
} & PluginManifest;

/**
 * Legacy Console dynamic plugin manifest format.
 */
export type LegacyConsolePluginManifest = Pick<
  PluginManifest,
  'name' | 'version' | 'dependencies' | 'extensions'
> &
  ConsoleSupportedCustomProperties;

/**
 * This type supports both standard and legacy Console dynamic plugin manifest formats.
 *
 * Console application automatically adapts the manifest to standard format when loading
 * the given plugin.
 */
export type AnyConsolePluginManifest = StandardConsolePluginManifest | LegacyConsolePluginManifest;

export const isStandardPluginManifest = (
  m: AnyConsolePluginManifest,
): m is StandardConsolePluginManifest =>
  // Standard plugin manifests must have a string valued baseURL property
  // eslint-disable-next-line dot-notation
  m['baseURL'] && typeof m['baseURL'] === 'string';
