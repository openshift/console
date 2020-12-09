import { K8sResourceCommon } from '@console/internal/module/k8s';

export enum Verb {
  Create = 'Create',
  Remove = 'Remove',
  Patch = 'Patch',
}

export enum Roles {
  view = 'view',
  admin = 'admin',
  edit = 'edit',
}

export interface UserRoleBinding {
  roleBindingName?: string;
  user: string;
  role: string;
}

type ApiGroupType = {
  apiGroup: string;
  kind: string;
  name: string;
};

export type RoleBinding = K8sResourceCommon & {
  roleRef: ApiGroupType;
  subjects: ApiGroupType[];
};

export const roleBinding: RoleBinding = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'RoleBinding',
  metadata: {
    name: '',
    namespace: '',
  },
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: '',
  },
  subjects: [
    {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: '',
    },
  ],
};
