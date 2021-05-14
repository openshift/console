import * as _ from 'lodash';
import {
  UserRoleBinding,
  RoleBinding,
  ProjectAccessRoles,
} from './project-access-form-utils-types';

export const defaultAccessRoles = {
  admin: 'Admin',
  edit: 'Edit',
  view: 'View',
};

export type Roles = {
  [key: string]: string;
};

export const getAvailableAccessRoles = (): string[] | undefined => {
  if (!window.SERVER_FLAGS.projectAccessClusterRoles) return undefined;
  return JSON.parse(window.SERVER_FLAGS.projectAccessClusterRoles);
};

export const filterRoleBindings = (
  roleBindings: RoleBinding[],
  clusterRoleNames: string[],
): RoleBinding[] => {
  return _.filter(roleBindings, (user: RoleBinding) =>
    clusterRoleNames.includes(user.roleRef.name),
  );
};

export const getUsersFromSubject = (user: RoleBinding): UserRoleBinding[] =>
  user.subjects?.map((obj) => ({
    roleBindingName: user.metadata.name,
    user: obj.name,
    role: user.roleRef.name,
  }));

export const getUserRoleBindings = (roleBindings: RoleBinding[]): UserRoleBinding[] =>
  _.flatten(roleBindings.map((user) => getUsersFromSubject(user)));

export const defaultProjectAccessRoles: ProjectAccessRoles = {
  availableClusterRoles: ['admin', 'edit', 'view'],
};

export const ignoreRoleBindingName = (roleBinding: UserRoleBinding[]) => {
  const res = roleBinding.map((obj) => ({ user: obj.user, role: obj.role }));
  return _.sortBy(res, ['user']);
};
