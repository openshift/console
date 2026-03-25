import type { FC } from 'react';
import type { FeatureFlagHandler, SetFeatureFlag } from '@console/dynamic-plugin-sdk/src';

type FeatureFlagExtensionHookResolverProps = {
  handler: FeatureFlagHandler;
  setFeatureFlag: SetFeatureFlag;
};

export const FeatureFlagExtensionHookResolver: FC<FeatureFlagExtensionHookResolverProps> = ({
  handler,
  setFeatureFlag,
}) => {
  handler(setFeatureFlag);
  return null;
};
