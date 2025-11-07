import { useEffect } from 'react';
import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { k8sGet, useK8sModel } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { getInfrastructurePlatform } from '@console/shared/src/selectors/infrastructure';

export const VAC_PLATFORM_SUPPORT_FLAG = 'VAC_PLATFORM_SUPPORT';

/**
 * Hook provider for VolumeAttributesClass platform support detection.
 * VAC is only supported on AWS and GCP platforms.
 */
export const useVACPlatformSupportProvider = (setFeatureFlag: SetFeatureFlag) => {
  const [InfrastructureModel] = useK8sModel({
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'Infrastructure',
  });

  useEffect(() => {
    const detectPlatformSupport = async () => {
      try {
        const infrastructure = await k8sGet({
          model: InfrastructureModel,
          name: 'cluster',
        });
        const platform = getInfrastructurePlatform(infrastructure);
        const isSupported = platform === 'AWS' || platform === 'GCP';
        setFeatureFlag(VAC_PLATFORM_SUPPORT_FLAG, isSupported);
      } catch (error) {
        // If we can't determine the platform, assume VAC is not supported
        // console.warn('Failed to detect platform for VAC support:', error);
        setFeatureFlag(VAC_PLATFORM_SUPPORT_FLAG, false);
      }
    };

    if (InfrastructureModel) {
      detectPlatformSupport();
    }
  }, [InfrastructureModel, setFeatureFlag]);
};
