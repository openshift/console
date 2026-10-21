import * as _ from 'lodash';
import type { UserRoleBinding, RoleBinding } from './project-access-form-utils-types';

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

export const getFormDataFromRoleBinding = (
  user: RoleBinding,
  namespace: string,
): UserRoleBinding[] =>
  user.subjects?.map((obj) => ({
    roleBindingName: user.metadata.name,
    subject: { ...obj, namespace: obj.kind !== 'ServiceAccount' ? namespace : obj.namespace },
    role: user.roleRef.name,
    subjects: user.subjects,
  }));

export const getUserRoleBindings = (
  roleBindings: RoleBinding[],
  clusterRoleNames: string[],
  namespace: string,
): UserRoleBinding[] =>
  roleBindings.reduce((acc, roleBinding: RoleBinding) => {
    if (clusterRoleNames.includes(roleBinding.roleRef.name) && roleBinding.subjects?.length > 0) {
      acc.push(...getFormDataFromRoleBinding(roleBinding, namespace));
    }
    return acc;
  }, []);

export const ignoreRoleBindingName = (roleBinding: UserRoleBinding[]) => {
  const res = roleBinding.map((obj) => ({
    user: obj.subject?.name,
    role: obj.role,
    type: obj.subject?.kind,
  }));
  return _.sortBy(res, ['user']);
};
