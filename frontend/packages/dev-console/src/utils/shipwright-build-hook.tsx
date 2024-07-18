import * as React from 'react';
import { ImportStrategy } from '@console/git-service/src';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared';
import { ClusterBuildStrategyModel } from '@console/shipwright-plugin/src/models';
import { ClusterBuildStrategy } from '@console/shipwright-plugin/src/types';

/** NOTE: ClusterBuildStrategies are needed to be installed to use Shipwright Builds */
export const useShipwrightBuilds = (): boolean => {
  return useFlag('SHIPWRIGHT_BUILD');
};

export interface AvailableBuildStrategies {
  s2i: boolean;
  buildah: boolean;
}

export const useClusterBuildStrategy = (): [AvailableBuildStrategies, boolean] => {
  const [data, setData] = React.useState<AvailableBuildStrategies>({
    s2i: false,
    buildah: false,
  });
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [, s2iLoaded, s2iErr] = useK8sGet<K8sResourceKind>(
    ClusterBuildStrategyModel,
    ClusterBuildStrategy.S2I,
  );
  const [, buildahLoaded, buildahErr] = useK8sGet<K8sResourceKind>(
    ClusterBuildStrategyModel,
    ClusterBuildStrategy.BUILDAH,
  );

  React.useEffect(() => {
    if (s2iLoaded && buildahLoaded) {
      setLoaded(true);
    }
  }, [s2iLoaded, buildahLoaded]);

  React.useEffect(() => {
    if (loaded) {
      if (!s2iErr) {
        setData((prevData) => ({
          ...prevData,
          s2i: true,
        }));
      }
      if (!buildahErr) {
        setData((prevData) => ({
          ...prevData,
          buildah: true,
        }));
      }
    }
  }, [loaded, s2iErr, buildahErr]);

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
