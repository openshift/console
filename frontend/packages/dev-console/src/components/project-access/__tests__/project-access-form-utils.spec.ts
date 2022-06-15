import { ignoreRoleBindingName } from '../project-access-form-utils';
import { UserRoleBinding } from '../project-access-form-utils-types';

describe('Project access form utils', () => {
  it('should ignore the role binding name from the role binding obj', async () => {
    const roleBinding: UserRoleBinding[] = [
      {
        subject: {
          name: 'ab',
          kind: 'User',
          apiGroup: 'rbac.authorization.k8s.io',
        },
        subjects: [],
        role: 'edit',
        roleBindingName: 'ab-edit',
      },
      {
        subject: {
          name: 'kubeadmin',
          kind: 'User',
          apiGroup: 'rbac.authorization.k8s.io',
        },
        subjects: [],
        role: 'admin',
        roleBindingName: 'kube-admin',
      },
      {
        subject: {
          name: 'de',
          kind: 'User',
          apiGroup: 'rbac.authorization.k8s.io',
        },
        subjects: [],
        role: 'view',
        roleBindingName: 'de-view',
      },
    ];
    expect(ignoreRoleBindingName(roleBinding)).toEqual([
      {
        user: 'ab',
        role: 'edit',
      },
      { user: 'de', role: 'view' },
      { user: 'kubeadmin', role: 'admin' },
    ]);
  });
});
