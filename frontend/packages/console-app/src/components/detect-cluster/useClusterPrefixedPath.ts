import * as React from 'react';
import { generatePath } from 'react-router';
import { CLUSTER_ROUTE_PREFIX, useActiveCluster } from '@console/shared/src';

export const getClusterPrefixedPath = (path: string, cluster: string): string => {
  if (window.SERVER_FLAGS.clusters?.length > 1) {
    return generatePath(`${CLUSTER_ROUTE_PREFIX}${path}`, { cluster });
  }
  return path;
};

// Takes a path and adds the current cluster prefix to it if the multicluster is enabled.
export const useClusterPrefixedPath = (path: string): string => {
  const [activeCluster] = useActiveCluster();
  return React.useMemo(() => (path ? getClusterPrefixedPath(path, activeCluster) : undefined), [
    path,
    activeCluster,
  ]);
};
