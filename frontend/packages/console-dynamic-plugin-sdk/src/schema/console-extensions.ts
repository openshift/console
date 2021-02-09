import { FeatureFlag, ModelFeatureFlag } from '../extensions/feature-flags';
import { ReduxReducer } from '../extensions/redux';

export type SupportedExtension = FeatureFlag | ModelFeatureFlag | ReduxReducer;

/**
 * Schema of Console plugin's `console-extensions.json` file.
 */
export type ConsoleExtensionsJSON = {
  /** Reference to JSON schema. */
  $schema?: string;
  /** List of extensions contributed by the plugin. */
  data: SupportedExtension[];
};
