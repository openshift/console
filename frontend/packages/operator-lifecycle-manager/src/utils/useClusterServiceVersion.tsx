import * as React from 'react';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';
import { GLOBAL_COPIED_CSV_NAMESPACE } from '../const';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind } from '../types';
import { isCopiedCSV } from './clusterserviceversions';

const groupVersionKind = {
  group: ClusterServiceVersionModel.apiGroup,
  version: ClusterServiceVersionModel.apiVersion,
  kind: ClusterServiceVersionModel.kind,
};

export const useClusterServiceVersion = (
  name: string,
  namespace: string,
): [ClusterServiceVersionKind, boolean, any] => {
  const [cluster] = useActiveCluster();
  const [namespacedCSV, namespacedCSVLoaded, namespacedCSVLoadError] = useK8sWatchResource<
    ClusterServiceVersionKind
  >({
    groupVersionKind,
    name,
    namespace,
    optional: window.SERVER_FLAGS.copiedCSVsDisabled[cluster],
  });
  const [globalCSV, globalCSVLoaded, globalCSVLoadError] = useK8sWatchResource<
    ClusterServiceVersionKind
  >({
    groupVersionKind,
    name,
    namespace: GLOBAL_COPIED_CSV_NAMESPACE,
    optional: window.SERVER_FLAGS.copiedCSVsDisabled[cluster],
  });

  return React.useMemo(() => {
    if (window.SERVER_FLAGS.copiedCSVsDisabled[cluster] && Boolean(namespacedCSVLoadError)) {
      return [isCopiedCSV(globalCSV) ? globalCSV : null, globalCSVLoaded, globalCSVLoadError];
    }
    return [namespacedCSV, namespacedCSVLoaded, namespacedCSVLoadError];
  }, [
    cluster,
    globalCSV,
    globalCSVLoadError,
    globalCSVLoaded,
    namespacedCSV,
    namespacedCSVLoadError,
    namespacedCSVLoaded,
  ]);
};
