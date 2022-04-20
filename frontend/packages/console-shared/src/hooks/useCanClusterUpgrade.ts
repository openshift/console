import { useAccessReviewAllowed } from '@console/dynamic-plugin-sdk';
import { ClusterVersionModel } from '@console/internal/models';

export const isClusterExternallyManaged = (): boolean => {
  return window.SERVER_FLAGS.controlPlaneTopology === 'External';
};

export const useCanClusterUpgrade = (): boolean => {
  const hasPermissionsToUpdate = useAccessReviewAllowed({
    group: ClusterVersionModel.apiGroup,
    resource: ClusterVersionModel.plural,
    verb: 'patch',
    name: 'version',
  });
  const notExternallyManaged = !isClusterExternallyManaged();
  const brandingNotDedicated = window.SERVER_FLAGS.branding !== 'dedicated';
  const canPerformUpgrade = hasPermissionsToUpdate && brandingNotDedicated && notExternallyManaged;

  return canPerformUpgrade;
};
