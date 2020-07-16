import { useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { referenceForModel, ClusterVersionKind } from '@console/internal/module/k8s';
import { ClusterVersionModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getFlagsObject } from '@console/internal/reducers/features';
import { RootState } from '@console/internal/redux';
import { FLAGS } from '../constants';

const getClusterVersionFlag = (state: RootState) => getFlagsObject(state)?.[FLAGS.CLUSTER_VERSION];

export const useClusterVersion = (): ClusterVersionKind => {
  const isClusterVersion = useSelector(getClusterVersionFlag);
  const resource = isClusterVersion
    ? { kind: referenceForModel(ClusterVersionModel), name: 'version', isList: false }
    : null;
  const [cvData, cvLoaded, cvLoadError] = useK8sWatchResource<ClusterVersionKind>(resource);
  return cvLoaded && !cvLoadError ? cvData : null;
};

export const useOpenshiftVersion = (): string => {
  const [openshiftVersion, setOpenshiftVersion] = useState<string>();
  const clusterVersion = useClusterVersion();
  const version = clusterVersion?.status?.history?.[0]?.version;
  useEffect(() => {
    setOpenshiftVersion(version);
  }, [version]);
  return openshiftVersion;
};
