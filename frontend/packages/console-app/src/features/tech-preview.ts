import type { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { FLAG_TECH_PREVIEW } from '../consts';

export const handler: FeatureFlagHandler = (setFeatureFlag) => {
  setFeatureFlag(FLAG_TECH_PREVIEW, !!window.SERVER_FLAGS.techPreview);
};
