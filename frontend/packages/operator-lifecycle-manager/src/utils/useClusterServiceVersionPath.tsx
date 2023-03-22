import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { resourceObjPath, resourcePath } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY, useActiveNamespace } from '@console/shared';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind } from '../types';

export const useClusterServiceVersionPath = (csv: ClusterServiceVersionKind): string => {
  const [activeNamespace] = useActiveNamespace();
  const [cluster] = useActiveCluster();
  const csvReference = getReferenceForModel(ClusterServiceVersionModel);
  // Don't link to csv in 'openshift' namespace when copiedCSVsDisabled and in another namespace
  if (
    window.SERVER_FLAGS.copiedCSVsDisabled[cluster] &&
    csv.metadata.namespace === 'openshift' && // Is global csv
    activeNamespace !== ALL_NAMESPACES_KEY
  ) {
    return resourcePath(csvReference, csv.metadata.name, activeNamespace, cluster);
  }
  return resourceObjPath(csv, csvReference);
};
