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
  {
    metadata: {
      name: 'check-edit',
      namespace: 'xyz',
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'edit',
    },
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
    subject: {
      name: 'ab',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
  {
    subject: {
      name: 'c',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
];
export const rolesBindingsToBeRemoved1: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    subject: {
      name: 'a',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
];

export const rolesWithNameChangeResult: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    subject: {
      name: 'ab',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
];

export const initialRoles1: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    subject: {
      name: 'ab',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
  {
    roleBindingName: 'c-view',
    subject: {
      name: 'c',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
];

export const formValues1: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    subject: {
      name: 'ab',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
];

export const rolesBindingsToBeRemoved: UserRoleBinding[] = [
  {
    roleBindingName: 'c-view',
    subject: {
      name: 'c',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
];

export const formValues2: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    subject: {
      name: 'ab',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
  {
    roleBindingName: 'c-view',
    subject: {
      name: 'c',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    subject: {
      name: 'd',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
];

export const roleBindingsToBeCreated2: UserRoleBinding[] = [
  {
    subject: {
      name: 'd',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
];

export const initialRoles2: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    subject: {
      name: 'ab',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'xy-admin',
    subject: {
      name: 'xy',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
  {
    roleBindingName: 'yx-view',
    subject: {
      name: 'yx',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
];
export const roleBindingsToBeCreated3: UserRoleBinding[] = [
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
  {
    subject: {
      name: 'c',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
];

export const rolesBindingsToBeRemoved2: UserRoleBinding[] = [
  {
    roleBindingName: 'a-view',
    subject: {
      name: 'ab',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
];

export const displayRoleBindings: UserRoleBinding[] = [
  {
    roleBindingName: 'xy-admin',
    subject: {
      name: 'xy',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
  {
    roleBindingName: 'yx-view',
    subject: {
      name: 'yx',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'view',
  },
  {
    roleBindingName: 'b-view',
    subject: {
      name: 'b',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
    role: 'admin',
  },
  {
    subject: {
      name: 'c',
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
    },
    subjects: [],
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

export const newRoles: UserRoleBinding[] = [
  {
    role: 'admin',
    subject: {
      name: 'dd',
      apiGroup: '',
      kind: '',
    },
    subjects: null,
  },
  {
    role: 'admin',
    roleBindingName: 'a-edit-efb4fed775d423d2',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'a',
    },
    subjects: [{ apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'a' }],
  },
  {
    role: 'admin',
    roleBindingName: 'admin-d',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'user5',
    },

    subjects: [
      { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'system:admin' },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user1',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user2',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user3',
      },
    ],
  },
  {
    role: 'edit',
    roleBindingName: 'admin-d',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'user3',
    },

    subjects: [
      { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'system:admin' },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user1',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user2',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user3',
      },
      { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'system:admin' },
    ],
  },
];

export const removeRoles = [
  {
    role: 'edit',
    roleBindingName: 'a-edit-efb4fed775d423d2',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'a',
    },
    subjects: [{ apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'a' }],
  },
  {
    role: 'admin',
    roleBindingName: 'admin-d',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'user1',
    },
    subjects: [
      { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'system:admin' },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user1',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user2',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user3',
      },
    ],
  },
  {
    role: 'admin',
    roleBindingName: 'admin-d',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'user2',
    },
    subjects: [
      { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'system:admin' },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user1',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user2',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user3',
      },
    ],
  },
  {
    role: 'admin',
    roleBindingName: 'admin-d',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'user3',
    },
    subjects: [
      { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'system:admin' },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user1',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user2',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user3',
      },
    ],
  },
];
export const updateRoles = [
  {
    role: 'admin',
    roleBindingName: 'admin-d',
    subject: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'user5',
    },
    subjects: [
      { apiGroup: 'rbac.authorization.k8s.io', kind: 'User', name: 'system:admin' },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user1',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user2',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'user3',
      },
    ],
  },
];
