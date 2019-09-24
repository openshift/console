import { filterRoleBindings, getUserRoleBindings } from '../project-access-form-utils';
import { Roles } from '../project-access-form-utils-types';
import {
  roleBindingsResourceData,
  roleBindingsWithRequiredRolesResult,
  roleBindingsWithRequiredRoles,
  roleBindingsWithRequiredAttributes,
} from '../__mocks__/project-access-form-mock';

describe('Fetch required roles', () => {
  it('should fetch the only the required rolebindings', async () => {
    const filteredRoleBindings = filterRoleBindings(roleBindingsResourceData, Roles);
    expect(filteredRoleBindings).toEqual(roleBindingsWithRequiredRolesResult);
  });

  it('should consider only the required attributes', async () => {
    const userRoleBindings = getUserRoleBindings(roleBindingsWithRequiredRoles);
    expect(userRoleBindings).toEqual(roleBindingsWithRequiredAttributes);
  });
});
