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
  const brandingManagedUpdates =
    window.SERVER_FLAGS.branding === 'dedicated' || window.SERVER_FLAGS.branding === 'rosa';
  const canPerformUpgrade =
    hasPermissionsToUpdate && !brandingManagedUpdates && notExternallyManaged;

  return canPerformUpgrade;
};
