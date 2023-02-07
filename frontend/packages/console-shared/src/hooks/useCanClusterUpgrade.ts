import { useAccessReviewAllowed } from '@console/dynamic-plugin-sdk';
import { ClusterVersionModel } from '@console/internal/models';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';

export const isClusterExternallyManaged = (cluster: string): boolean => {
  return window.SERVER_FLAGS.controlPlaneTopology[cluster] === 'External';
};

export const useCanClusterUpgrade = (): boolean => {
  const hasPermissionsToUpdate = useAccessReviewAllowed({
    group: ClusterVersionModel.apiGroup,
    resource: ClusterVersionModel.plural,
    verb: 'patch',
    name: 'version',
  });
  const [cluster] = useActiveCluster();
  const notExternallyManaged = !isClusterExternallyManaged(cluster);
  const brandingNotDedicated = window.SERVER_FLAGS.branding !== 'dedicated';
  const canPerformUpgrade = hasPermissionsToUpdate && brandingNotDedicated && notExternallyManaged;

  return canPerformUpgrade;
};
