import { useAccessReview } from '@console/internal/components/utils';
import { ClusterVersionModel } from '@console/internal/models';

export const useCanClusterUpgrade = (): boolean => {
  const hasPermissionsToUpdate = useAccessReview({
    group: ClusterVersionModel.apiGroup,
    resource: ClusterVersionModel.plural,
    verb: 'patch',
    name: 'version',
  });

  const brandingNotDedicated = window.SERVER_FLAGS.branding !== 'dedicated';
  return hasPermissionsToUpdate && brandingNotDedicated;
};
