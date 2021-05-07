import { filterRoleBindings, getUserRoleBindings } from '../project-access-form-utils';

import {
  roleBindingsResourceData,
  roleBindingsWithRequiredRolesResult,
  roleBindingsWithRequiredRoles,
  roleBindingsWithRequiredAttributes,
} from './project-access-form-data';

describe('Fetch required roles', () => {
  it('should fetch the only the required rolebindings', async () => {
    window.SERVER_FLAGS.projectAccessClusterRoles = '["admin", "view"]';
    const filteredRoleBindings = filterRoleBindings(roleBindingsResourceData, ['admin', 'view']);
    expect(filteredRoleBindings).toEqual(roleBindingsWithRequiredRolesResult);
  });

  it('should consider only the required attributes', async () => {
    const userRoleBindings = getUserRoleBindings(roleBindingsWithRequiredRoles);
    expect(userRoleBindings).toEqual(roleBindingsWithRequiredAttributes);
  });
});
