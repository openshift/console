import * as _ from 'lodash';
import type { K8sResourceKind } from '../../module/k8s/types';

export const isSystemRole = (role: K8sResourceKind) => _.startsWith(role.metadata.name, 'system:');

export const roleKind = (role: K8sResourceKind) =>
  role.metadata.namespace ? 'Role' : 'ClusterRole';

export const roleType = (role: K8sResourceKind) => {
  if (!role) {
    return undefined;
  }
  if (isSystemRole(role)) {
    return 'system';
  }
  return role.metadata.namespace ? 'namespace' : 'cluster';
};
