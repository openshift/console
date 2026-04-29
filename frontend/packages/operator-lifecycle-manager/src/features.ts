import type { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { Flags } from './const';

export const detectLifecycleMetadata: FeatureFlagHandler = (setFeatureFlag) => {
  setFeatureFlag(Flags.OPERATOR_LIFECYCLE_METADATA, !!window.SERVER_FLAGS.techPreview);
};
