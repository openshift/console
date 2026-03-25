import type { RemotePluginManifest } from '@openshift/dynamic-plugin-sdk';
import type { ConsoleSupportedCustomProperties } from '../build-types';

/**
 * Schema of Console plugin's `plugin-manifest.json` file.
 */
export type ConsolePluginManifestJSON = {
  /** Plugin manifest properties that are not provided by the base RemotePluginManifest schema. */
  customProperties?: {
    console?: ConsoleSupportedCustomProperties;
    [namespace: string]: unknown;
  };
} & RemotePluginManifest;
