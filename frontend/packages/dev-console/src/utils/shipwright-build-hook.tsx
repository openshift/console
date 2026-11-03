import { useMemo } from 'react';
import { ImportStrategy } from '@console/git-service/src/types/git';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { ClusterBuildStrategyModel } from '@console/shipwright-plugin/src/models';
import { ClusterBuildStrategy } from '@console/shipwright-plugin/src/types';

/** NOTE: ClusterBuildStrategies are needed to be installed to use Shipwright Builds */
export const useShipwrightBuilds = (): boolean => useFlag('SHIPWRIGHT_BUILD');

export interface AvailableBuildStrategies {
  s2i: boolean;
  buildah: boolean;
}

export const useClusterBuildStrategy = (): [AvailableBuildStrategies, boolean] => {
  const [, s2iLoaded, s2iErr] = useK8sGet<K8sResourceKind>(
    ClusterBuildStrategyModel,
    ClusterBuildStrategy.S2I,
  );
  const [, buildahLoaded, buildahErr] = useK8sGet<K8sResourceKind>(
    ClusterBuildStrategyModel,
    ClusterBuildStrategy.BUILDAH,
  );

  // Both strategies are fetched exactly once (constant name/namespace), so
  // `loaded` and the availability map are derived directly from the fetch
  // results. The map is memoized on the effective availability booleans so
  // pending-state error churn does not recreate it.
  const loaded = s2iLoaded && buildahLoaded;
  const s2iAvailable = loaded && !s2iErr;
  const buildahAvailable = loaded && !buildahErr;
  const data: AvailableBuildStrategies = useMemo(
    () => ({ s2i: s2iAvailable, buildah: buildahAvailable }),
    [s2iAvailable, buildahAvailable],
  );

  return [data, loaded];
};

export const isPreferredStrategyAvailable = (
  importStrategy: ImportStrategy,
  clusterBuildStrategy: AvailableBuildStrategies,
) => {
  switch (importStrategy) {
    case ImportStrategy.S2I:
      return clusterBuildStrategy.s2i;
    case ImportStrategy.DOCKERFILE:
      return clusterBuildStrategy.buildah;
    default:
      return false;
  }
};
