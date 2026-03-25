import { useEffect } from 'react';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { InfrastructureModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { FLAGS } from '@console/shared/src/constants/common';
import { getInfrastructurePlatform } from '@console/shared/src/selectors/infrastructure';

/**
 * Platforms that support VolumeAttributesClass (VAC) modifications on a PVC.
 * VAC is only supported on AWS and GCP platforms.
 */
const VAC_SUPPORTED_PLATFORMS = ['AWS', 'GCP'] as const;

/**
 * Hook provider for VolumeAttributesClass platform support detection.
 * VAC is only supported on AWS and GCP platforms.
 */
export const useVACPlatformSupportProvider = (setFeatureFlag: SetFeatureFlag) => {
  const [infrastructure, loaded, error] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );

  useEffect(() => {
    if (loaded && !error) {
      const platform = getInfrastructurePlatform(infrastructure);
      const isSupported = VAC_SUPPORTED_PLATFORMS.includes(
        platform as typeof VAC_SUPPORTED_PLATFORMS[number],
      );

      setFeatureFlag(FLAGS.VAC_PLATFORM_SUPPORT, isSupported);
    } else if (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to detect platform for VAC support:', error);
      setFeatureFlag(FLAGS.VAC_PLATFORM_SUPPORT, false);
    }
  }, [error, infrastructure, loaded, setFeatureFlag]);
};
