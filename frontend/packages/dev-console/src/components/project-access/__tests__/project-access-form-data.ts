import { UserRoleBinding, RoleBinding } from '../project-access-form-utils-types';

export const mockProjectAccessData = {
  projectAccess: [
    {
      user: 'abc',
      role: 'view',
    },
  ],
};

export const roleBindingsResourceData: RoleBinding[] = [
  {
    metadata: {
      name: 'admin',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'admin',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'kube:admin',
      },
    ],
  },
  {
    metadata: {
      name: 'view',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'view',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'abc',
      },
    ],
  },
  {
    metadata: {
      name: 'example',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'example-role',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'check-role',
      },
    ],
  },
];

export const roleBindingsWithRequiredRolesResult = [
  {
    metadata: {
      name: 'admin',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'admin',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'kube:admin',
      },
    ],
  },
  {
    metadata: {
      name: 'view',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'view',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'abc',
      },
    ],
  },
];

export const roleBindingsWithRequiredRoles = [
  {
    metadata: {
      name: 'check-admin',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'admin',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'kube:admin',
      },
    ],
  },
  {
    metadata: {
      name: 'check-view',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'view',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'abc',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'mno',
      },
    ],
  },
];

export const roleBindingsWithRequiredAttributes = [
  {
    roleBindingName: 'check-admin',
    user: 'kube:admin',
    role: 'admin',
  },
  {
    roleBindingName: 'check-view',
    user: 'abc',
    role: 'view',
  },
  {
    roleBindingName: 'check-view',
    user: 'mno',
    role: 'view',
  },
];

export const roleBindingsToBeCreated1: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'ab',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'admin',
  },
  {
    user: 'c',
    role: 'view',
  },
];
export const rolesBindingsToBeRemoved1: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'a',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'view',
  },
];

export const rolesWithNameChangeResult: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'ab',
    role: 'view',
  },
];

export const initialRoles1: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'ab',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'admin',
  },
  {
    roleBindingName: 'c-view',
    user: 'c',
    role: 'view',
  },
];

export const formValues1: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'ab',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'admin',
  },
];

export const rolesBindingsToBeRemoved: UserRoleBinding[] = [
  {
    roleBindingName: 'c-view',
    user: 'c',
    role: 'view',
  },
];

export const formValues2: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'ab',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'admin',
  },
  {
    roleBindingName: 'c-view',
    user: 'c',
    role: 'view',
  },
  {
    user: 'd',
    role: 'admin',
  },
];

export const roleBindingsToBeCreated2: UserRoleBinding[] = [
  {
    user: 'd',
    role: 'admin',
  },
];

export const initialRoles2: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'ab',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'view',
  },
  {
    roleBindingName: 'xy-admin',
    user: 'xy',
    role: 'admin',
  },
  {
    roleBindingName: 'yx-view',
    user: 'yx',
    role: 'view',
  },
];
export const roleBindingsToBeCreated3: UserRoleBinding[] = [
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'admin',
  },
  {
    user: 'c',
    role: 'admin',
  },
];

export const rolesBindingsToBeRemoved2: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    user: 'ab',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'view',
  },
];

export const displayRoleBindings: UserRoleBinding[] = [
  {
    roleBindingName: 'xy-admin',
    user: 'xy',
    role: 'admin',
  },
  {
    roleBindingName: 'yx-view',
    user: 'yx',
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    user: 'b',
    role: 'admin',
  },
  {
    user: 'c',
    role: 'admin',
  },
];

export const getGroupedRoleResult = {
  metadata: {
    name: 'check-view',
    namespace: 'xyz',
  },
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'view',
  },
  subjects: [
    {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'abc',
    },
  ],
};
