import {
  filterRoleBindings,
  getUserRoleBindings,
  ignoreRoleBindingName,
} from '../project-access-form-utils';
import { UserRoleBinding } from '../project-access-form-utils-types';

import {
  roleBindingsResourceData,
  roleBindingsWithRequiredRolesResult,
  roleBindingsWithRequiredRoles,
  roleBindingsWithRequiredAttributes,
} from './project-access-form-data';

describe('Project access form utils', () => {
  it('should fetch the only the required rolebindings', async () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["admin", "view"]';
    const filteredRoleBindings = filterRoleBindings(roleBindingsResourceData, ['admin', 'view']);
    expect(filteredRoleBindings).toEqual(roleBindingsWithRequiredRolesResult);
  });

  it('should consider only the required attributes', async () => {
    const userRoleBindings = getUserRoleBindings(roleBindingsWithRequiredRoles);
    expect(userRoleBindings).toEqual(roleBindingsWithRequiredAttributes);
  });

  it('should ignore the role binding name from the role binding obj', async () => {
    const roleBinding: UserRoleBinding[] = [
      {
        user: 'ab',
        role: 'edit',
        roleBindingName: 'ab-edit',
      },
      { user: 'kubeadmin', role: 'admin', roleBindingName: 'kube-admin' },
      { user: 'de', role: 'view', roleBindingName: 'de-view' },
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
