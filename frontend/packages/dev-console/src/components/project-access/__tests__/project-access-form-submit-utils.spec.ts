import {
  getRolesWithNameChange,
  getNewRoles,
  getRemovedRoles,
  getRolesWithMultipleSubjects,
  getRolesToUpdate,
} from '../project-access-form-submit-utils';
import {
  roleBindingsToBeCreated1,
  rolesBindingsToBeRemoved1,
  rolesWithNameChangeResult,
  initialRoles1,
  formValues1,
  rolesBindingsToBeRemoved,
  formValues2,
  roleBindingsToBeCreated2,
  newRoles,
  updateRoles,
  removeRoles,
} from './project-access-form-data';

describe('Project Access handleSubmit Utils', () => {
  it('should get roles removed by the user', async () => {
    const deleteRoles = getRemovedRoles(initialRoles1, formValues1);
    expect(deleteRoles).toEqual(rolesBindingsToBeRemoved);
  });

  it('should get new roles added by the user', async () => {
    const result = getNewRoles(initialRoles1, formValues2);
    expect(result).toEqual(roleBindingsToBeCreated2);
  });

  it('should get roles with name change', async () => {
    const rolesWithNameChange = getRolesWithNameChange(
      roleBindingsToBeCreated1,
      rolesBindingsToBeRemoved1,
    );
    expect(rolesWithNameChange).toEqual(rolesWithNameChangeResult);
  });
  it('should get roles with multiple subjects', () => {
    const { updateRolesWithMultipleSubjects } = getRolesWithMultipleSubjects(
      newRoles,
      removeRoles,
      updateRoles,
    );
    expect(updateRolesWithMultipleSubjects).toEqual([
      {
        role: 'admin',
        roleBindingName: 'admin-d',
        subject: {
          kind: 'User',
          apiGroup: 'rbac.authorization.k8s.io',
          name: 'user1',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: 'system:admin',
          },
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: 'user5',
          },
        ],
      },
    ]);
  });
  it('should not update the subject type if the subject name is changed', () => {
    const newRoles1 = [
      {
        role: 'view',
        roleBindingName: 'group-rb',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'a-group1',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'a-group',
          },
        ],
      },
    ];

    const removeRoles1 = [
      {
        role: 'view',
        roleBindingName: 'group-rb',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'a-group',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'a-group',
          },
        ],
      },
    ];
    const rolesWithNameChange = getRolesWithNameChange(newRoles1, removeRoles1);
    expect(rolesWithNameChange).toEqual([
      {
        role: 'view',
        roleBindingName: 'group-rb',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'a-group1',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'a-group',
          },
        ],
      },
    ]);
  });
  it('should delete the old rolebinding and create a new one if the role is changed', () => {
    const initialRoles = [
      {
        role: 'edit',
        roleBindingName: 'edit',
        subject: {
          kind: 'ServiceAccount',
          name: 'pipeline',
          namespace: 'xyz',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'pipeline',
            namespace: 'xyz',
          },
        ],
      },
      {
        role: 'admin',
        roleBindingName: 'admin',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'User',
          name: 'kube:admin',
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
        role: 'view',
        roleBindingName: 'group-rb',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'a-group',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'a-group',
          },
        ],
      },
    ];

    const formRoles = [
      {
        role: 'edit',
        roleBindingName: 'edit',
        subject: {
          kind: 'ServiceAccount',
          name: 'pipeline',
          namespace: 'xyz',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'pipeline',
            namespace: 'xyz',
          },
        ],
      },
      {
        role: 'admin',
        roleBindingName: 'admin',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'User',
          name: 'kube:admin',
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
        role: 'admin',
        roleBindingName: 'group-rb',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'a-group',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'a-group',
          },
        ],
      },
    ];
    expect(getNewRoles(initialRoles, formRoles)).toEqual([
      {
        role: 'admin',
        roleBindingName: 'group-rb',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'a-group',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'a-group',
          },
        ],
      },
    ]);
    expect(getRemovedRoles(initialRoles, formRoles)).toEqual([
      {
        role: 'view',
        roleBindingName: 'group-rb',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Group',
          name: 'a-group',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Group',
            name: 'a-group',
          },
        ],
      },
    ]);
  });
  it('should create new rolebinding with ServiceAccount subject kind', () => {
    const initialRoles = [
      {
        role: 'edit',
        roleBindingName: 'edit',
        subject: {
          kind: 'ServiceAccount',
          name: 'pipeline',
          namespace: 'xyz',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'pipeline',
            namespace: 'xyz',
          },
        ],
      },
      {
        role: 'admin',
        roleBindingName: 'admin',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'User',
          name: 'kube:admin',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: 'kube:admin',
          },
        ],
      },
    ];

    const formRoles = [
      {
        role: 'edit',
        roleBindingName: 'edit',
        subject: {
          kind: 'ServiceAccount',
          name: 'pipeline',
          namespace: 'xyz',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'pipeline',
            namespace: 'xyz',
          },
        ],
      },
      {
        role: 'admin',
        roleBindingName: 'admin',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'User',
          name: 'kube:admin',
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
        role: 'admin',
        roleBindingName: 'sa-rb',
        subject: {
          kind: 'ServiceAccount',
          name: 'sa-test',
          namespace: 'abc',
        },
        subjects: [
          {
            namespace: 'abc',
            kind: 'ServiceAccount',
            name: 'sa-test',
          },
        ],
      },
    ];
    expect(getNewRoles(initialRoles, formRoles)).toEqual([
      {
        role: 'admin',
        roleBindingName: 'sa-rb',
        subject: {
          namespace: 'abc',
          kind: 'ServiceAccount',
          name: 'sa-test',
        },
        subjects: [
          {
            namespace: 'abc',
            kind: 'ServiceAccount',
            name: 'sa-test',
          },
        ],
      },
    ]);
  });
  it('should update subject for rolebinding with ServiceAccount subject kind', () => {
    const initialRoles = [
      {
        role: 'edit',
        roleBindingName: 'edit',
        subject: {
          kind: 'ServiceAccount',
          name: 'pipeline',
          namespace: 'xyz',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'pipeline',
            namespace: 'xyz',
          },
        ],
      },
      {
        role: 'admin',
        roleBindingName: 'admin',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'User',
          name: 'kube:admin',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: 'kube:admin',
          },
        ],
      },
    ];

    const formRoles = [
      {
        role: 'edit',
        roleBindingName: 'edit',
        subject: {
          kind: 'ServiceAccount',
          name: 'pipeline',
          namespace: 'abc',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'pipeline',
            namespace: 'xyz',
          },
        ],
      },
      {
        role: 'admin',
        roleBindingName: 'admin',
        subject: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'User',
          name: 'kube:admin',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: 'kube:admin',
          },
        ],
      },
    ];
    expect(
      getRolesToUpdate(
        getNewRoles(initialRoles, formRoles),
        getRemovedRoles(initialRoles, formRoles),
      ),
    ).toEqual([
      {
        role: 'edit',
        roleBindingName: 'edit',
        subject: {
          kind: 'ServiceAccount',
          name: 'pipeline',
          namespace: 'abc',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'pipeline',
            namespace: 'xyz',
          },
        ],
      },
    ]);
  });
});
