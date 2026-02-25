import { useEffect, useState } from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterVersionModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import type { ClusterVersionKind } from '@console/internal/module/k8s/types';
import { FLAGS } from '../constants';
import { useFlag } from './flag';

export const useClusterVersion = (): ClusterVersionKind => {
  const isClusterVersion = useFlag(FLAGS.CLUSTER_VERSION);
  const resource = isClusterVersion
    ? { kind: referenceForModel(ClusterVersionModel), name: 'version', isList: false }
    : null;
  const [cvData, cvLoaded, cvLoadError] = useK8sWatchResource<ClusterVersionKind>(resource);
  return cvLoaded && !cvLoadError ? cvData : null;
};

export const useOpenShiftVersion = (): string => {
  const [openshiftVersion, setOpenShiftVersion] = useState<string>();
  const clusterVersion = useClusterVersion();
  const version = clusterVersion?.status?.history?.[0]?.version;
  useEffect(() => {
    setOpenShiftVersion(version);
  }, [version]);
  return openshiftVersion;
};
