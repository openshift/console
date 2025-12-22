import type { FC } from 'react';
import { FeatureFlagHandler, SetFeatureFlag } from '@console/dynamic-plugin-sdk/src';

type FeatureFlagExtensionHookResolverProps = {
  handler: FeatureFlagHandler;
  setFeatureFlag: SetFeatureFlag;
};

export const FeatureFlagExtensionHookResolver: FC<FeatureFlagExtensionHookResolverProps> = ({
  handler,
  setFeatureFlag,
}) => {
  // Handler is a React hook that must be called during render, not in useEffect
  // The queueMicrotask in setFeatureFlag prevents "Cannot update component while rendering" errors
  // The reducer fixes prevent unnecessary state changes that would cause re-renders
  handler(setFeatureFlag);
  return null;
};
