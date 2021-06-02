import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterRoleModel } from '@console/internal/models';
import { K8sResourceCommon, WatchK8sResource } from '@console/internal/module/k8s';
import { defaultAccessRoles, getAvailableAccessRoles, Roles } from './project-access-form-utils';

export type ClusterRoleKind = K8sResourceCommon & {
  rules: { [key: string]: string[] }[];
};

export const useProjectAccessRoles = (): { data: Roles; loaded: boolean } => {
  const availableClusterRoles = getAvailableAccessRoles();

  const watchedClusterRoles = React.useMemo<Record<string, WatchK8sResource>>(() => {
    if (!availableClusterRoles || !availableClusterRoles.length) {
      return {};
    }
    return availableClusterRoles.reduce((acc, role) => {
      acc[role] = {
        kind: ClusterRoleModel.kind,
        name: role,
      };
      return acc;
    }, {} as Record<string, WatchK8sResource>);
  }, [availableClusterRoles]);

  const clusterRoles = useK8sWatchResources<Record<string, ClusterRoleKind>>(watchedClusterRoles);

  if (!availableClusterRoles || availableClusterRoles.length === 0) {
    return { data: defaultAccessRoles, loaded: true };
  }

  const mappedRoles = availableClusterRoles.reduce((acc, role) => {
    const clusterRole = clusterRoles[role];
    if (clusterRole?.loadError?.response?.status === 404) {
      // eslint-disable-next-line no-console
      console.warn(
        `ClusterRole ${role} could not be found and will not be shown in project access options.`,
      );
    } else if (clusterRole?.loaded && clusterRole?.data) {
      const label =
        clusterRole.data.metadata?.annotations?.['console.openshift.io/display-name'] ||
        clusterRole.data.metadata?.name ||
        role;
      acc[role] = label;
    } else {
      acc[role] = role;
    }
    return acc;
  }, {} as Roles);

  const allLoadedOrFailed = Object.values(clusterRoles).every(
    (clusterRole) => clusterRole.loaded || clusterRole.loadError,
  );

  return { data: mappedRoles, loaded: allLoadedOrFailed };
};
