import * as _ from 'lodash';
import { UserRoleBinding, RoleBinding } from './project-access-form-utils-types';

export const filterRoleBindings = (roleBindings: RoleBinding[], roles): RoleBinding[] => {
  return _.filter(roleBindings, (user: RoleBinding) => _.keys(roles).includes(user.roleRef.name));
};

export const getUsersFromSubject = (user: RoleBinding): UserRoleBinding[] =>
  user.subjects?.map((obj) => ({
    roleBindingName: user.metadata.name,
    user: obj.name,
    role: user.roleRef.name,
  }));

export const getUserRoleBindings = (roleBindings: RoleBinding[]): UserRoleBinding[] =>
  _.flatten(roleBindings.map((user) => getUsersFromSubject(user)));
