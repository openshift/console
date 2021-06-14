import {
  getRolesWithNameChange,
  getNewRoles,
  getRemovedRoles,
  getGroupedRole,
} from '../project-access-form-submit-utils';
import { UserRoleBinding } from '../project-access-form-utils-types';
import {
  roleBindingsToBeCreated1,
  rolesBindingsToBeRemoved1,
  rolesWithNameChangeResult,
  initialRoles1,
  formValues1,
  rolesBindingsToBeRemoved,
  formValues2,
  roleBindingsToBeCreated2,
  roleBindingsWithRequiredRoles,
  getGroupedRoleResult,
} from './project-access-form-data';

describe('Project Access handleSubmit Utils', () => {
  it('should get roles removed by the user', async () => {
    const deleteRoles = getRemovedRoles(initialRoles1, formValues1);
    expect(deleteRoles).toEqual(rolesBindingsToBeRemoved);
  });

  it('should get new roles added by the user', async () => {
    const newRoles = getNewRoles(initialRoles1, formValues2);
    expect(newRoles).toEqual(roleBindingsToBeCreated2);
  });

  it('should get roles with Name change', async () => {
    const rolesWithNameChange = getRolesWithNameChange(
      roleBindingsToBeCreated1,
      rolesBindingsToBeRemoved1,
    );
    expect(rolesWithNameChange).toEqual(rolesWithNameChangeResult);
  });

  it('should remove user belonging to grouped subjects in a Role Binding', async () => {
    const role: UserRoleBinding = {
      role: 'admin',
      roleBindingName: 'check-view',
      user: 'mno',
    };
    const groupedRole = getGroupedRole(role, roleBindingsWithRequiredRoles);
    expect(groupedRole).toEqual(getGroupedRoleResult);
  });
});
