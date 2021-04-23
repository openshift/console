import { FeatureFlag, ModelFeatureFlag } from '../extensions/feature-flags';
import { TelemetryListener } from '../extensions/telemetry';

export type SupportedExtension = FeatureFlag | ModelFeatureFlag | TelemetryListener;

/**
 * Schema of Console plugin's `console-extensions.json` file.
 */
export type ConsoleExtensionsJSON = {
  /** Reference to JSON schema. */
  $schema?: string;
  /** List of extensions contributed by the plugin. */
  data: SupportedExtension[];
};
