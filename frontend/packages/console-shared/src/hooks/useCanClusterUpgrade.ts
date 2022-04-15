import { useAccessReviewAllowed } from '@console/dynamic-plugin-sdk';
import { ClusterVersionModel } from '@console/internal/models';
import { ClusterVersionKind, hasAvailableUpdates } from '@console/internal/module/k8s';

export const isClusterExternallyManaged = (): boolean => {
  return window.SERVER_FLAGS.controlPlaneTopology === 'External';
};

export const useCanClusterUpgrade = (clusterVersion: ClusterVersionKind): boolean => {
  const hasPermissionsToUpdate = useAccessReviewAllowed({
    group: ClusterVersionModel.apiGroup,
    resource: ClusterVersionModel.plural,
    verb: 'patch',
    name: 'version',
  });
  const notExternallyManaged = !isClusterExternallyManaged();
  const bandingNotDedicated = window.SERVER_FLAGS.branding !== 'dedicated';
  const canPerformUpgrade = hasPermissionsToUpdate && bandingNotDedicated && notExternallyManaged;

  return hasAvailableUpdates(clusterVersion) && canPerformUpgrade;
};
