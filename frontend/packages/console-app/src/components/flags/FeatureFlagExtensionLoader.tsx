import * as React from 'react';
import {
  isFeatureFlagHookProvider,
  FeatureFlagHookProvider,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { featureFlagController } from '@console/internal/actions/features';
import FeatureFlagExtensionHookResolver from './FeatureFlagExtensionHookResolver';

const FeatureFlagExtensionLoader: React.FC = () => {
  const [flagProvider, flagProviderResolved] = useResolvedExtensions<FeatureFlagHookProvider>(
    isFeatureFlagHookProvider,
  );
  if (flagProviderResolved) {
    return (
      <>
        {flagProvider.map((nf) => {
          const {
            properties: { handler },
            uid,
          } = nf;
          return (
            <FeatureFlagExtensionHookResolver
              key={uid}
              handler={handler}
              setFeatureFlag={featureFlagController}
            />
          );
        })}
      </>
    );
  }
  return null;
};
export default FeatureFlagExtensionLoader;
