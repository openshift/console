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

export interface UserRole {
  metadata: {
    name: string;
  };
  roleRef: {
    name: string;
  };
  subjects: [
    {
      name: string;
    },
  ];
}

export interface UserRoleBinding {
  roleBindingName?: string;
  user: string;
  role: string;
}

export const roleBinding = {
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
