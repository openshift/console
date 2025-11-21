import { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { FLAG_TECH_PREVIEW } from '../consts';

type UseTechPreviewFlagProvider = (setFeatureFlag: SetFeatureFlag) => void;
const useTechPreviewFlagProvider: UseTechPreviewFlagProvider = (setFeatureFlag) => {
  setFeatureFlag(FLAG_TECH_PREVIEW, !!window.SERVER_FLAGS.techPreview);
};

export default useTechPreviewFlagProvider;
