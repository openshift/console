import * as React from 'react';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { useActiveCluster } from '@console/shared/src';
import { addPrefixToPath } from '@console/shared/src/utils/paths';

export const getClusterPrefixedPath = (path, activePerspective, activeCluster) =>
  activePerspective === 'acm' ? path : addPrefixToPath(path, `/c/${activeCluster}`);

// Takes a path and adds the current cluster prefis to it if the current perspective is
// single - cluster scoped.
// Temporary solution until the nav plugin API supports some way to indicate when a link should
// be prefixed with the current active cluster name.
export const useClusterPrefixedPath = (path: string): string => {
  const [activePerspective] = useActivePerspective();
  const [activeCluster] = useActiveCluster();
  return React.useMemo(() => getClusterPrefixedPath(path, activePerspective, activeCluster), [
    path,
    activeCluster,
    activePerspective,
  ]);
};
