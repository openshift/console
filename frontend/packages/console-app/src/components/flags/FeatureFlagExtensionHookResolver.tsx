import * as React from 'react';
import { FeatureFlagHandler, SetFeatureFlag } from '@console/dynamic-plugin-sdk/src';

type FeatureFlagExtensionHookResolverProps = {
  handler: FeatureFlagHandler;
  setFeatureFlag: SetFeatureFlag;
};

const FeatureFlagExtensionHookResolver: React.FC<FeatureFlagExtensionHookResolverProps> = ({
  handler,
  setFeatureFlag,
}) => {
  handler(setFeatureFlag);
  return null;
};

export default FeatureFlagExtensionHookResolver;
