import * as _ from 'lodash';
import {
  k8sCreateResource,
  k8sDeleteResource,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { RoleBindingModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { generateSecret } from '../import/import-submit-utils';
import { Verb, UserRoleBinding, RoleBinding } from './project-access-form-utils-types';

export const getRolesWithNameChange = (
  newRoles: UserRoleBinding[],
  removeRoles: UserRoleBinding[],
): UserRoleBinding[] => {
  const createRoles = _.filter(newRoles, 'roleBindingName');
  const deleteRoles = _.filter(removeRoles, (o1) =>
    createRoles.find((o2) => o1.roleBindingName === o2.roleBindingName),
  );
  const rolesWithNameChange = _.filter(createRoles, (o1) =>
    deleteRoles.find(
      (o2) =>
        o1.roleBindingName === o2.roleBindingName &&
        o1.subject.name !== o2.subject.name &&
        o1.role === o2.role,
    ),
  );
  return rolesWithNameChange;
};

export const sendK8sRequest = (
  verb: string,
  roleBinding: RoleBinding,
): Promise<K8sResourceKind> => {
  switch (verb) {
    case Verb.Create:
      return k8sCreateResource({ model: RoleBindingModel, data: roleBinding });
    case Verb.Remove:
      return k8sDeleteResource({ model: RoleBindingModel, resource: roleBinding });
    case Verb.Patch:
      return k8sPatchResource({
        model: RoleBindingModel,
        resource: roleBinding,
        data: [{ op: 'replace', path: `/subjects`, value: roleBinding.subjects }],
      });
    default:
      return null;
  }
};

export const generateRoleBindingName = (username: string, role: string): string => {
  return `${username}-${role}-${generateSecret()}`;
};

export const getNewRoles = (
  initialRoles: UserRoleBinding[],
  formValues: UserRoleBinding[],
): UserRoleBinding[] => {
  const newRoles = _.uniqBy(
    _.filter(
      formValues,
      (o1) =>
        !initialRoles.find((o2) => o1.subject.name === o2.subject.name && o1.role === o2.role),
    ),
    function(user) {
      return JSON.stringify([user.subject.name, user.role]);
    },
  );
  return newRoles;
};

export const getRemovedRoles = (
  initialRoles: UserRoleBinding[],
  formValues: UserRoleBinding[],
): UserRoleBinding[] => {
  const removeRoles = _.filter(
    initialRoles,
    (o1) =>
      !formValues.find(
        (o2: UserRoleBinding) => o1.subject.name === o2.subject.name && o1.role === o2.role,
      ),
  );
  return removeRoles;
};

export const sendRoleBindingRequest = (
  verb: string,
  roles: UserRoleBinding[],
  namespace: string,
) => {
  const finalArray: Promise<K8sResourceKind>[] = [];
  _.forEach(roles, (user) => {
    const roleBindingName =
      verb === Verb.Create
        ? generateRoleBindingName(user.subject.name, user.role)
        : user.roleBindingName;
    const subjects =
      verb === Verb.Create || verb === Verb.Remove
        ? [
            {
              apiGroup: 'rbac.authorization.k8s.io',
              kind: user.subject?.kind || 'User',
              name: user.subject.name,
            },
          ]
        : user.subjects.length > 1
        ? user.subjects
        : [user.subject];
    const roleBinding: RoleBinding = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {
        name: roleBindingName,
        namespace,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: user.role,
      },
      subjects,
    };
    finalArray.push(sendK8sRequest(verb, roleBinding));
  });
  return finalArray;
};

export const getRolesWithMultipleSubjects = (
  newRoles: UserRoleBinding[],
  removeRoles: UserRoleBinding[],
  updateRoles: UserRoleBinding[],
) => {
  const updateRolesWithMultipleSubjects: UserRoleBinding[] = [];
  _.remove(
    newRoles,
    (newRole) =>
      newRole.subjects?.length > 1 &&
      removeRoles.find(
        (role) => role.roleBindingName === newRole.roleBindingName && role.role === newRole.role,
      ),
  );

  _.remove(removeRoles, (removeRole) => {
    if (removeRole.subjects.length > 1) {
      const roleWithMultipleSubjects = updateRolesWithMultipleSubjects.find(
        (r) => r.roleBindingName === removeRole.roleBindingName,
      );
      if (roleWithMultipleSubjects) {
        const newSubs = roleWithMultipleSubjects.subjects.filter(
          (sub) => sub.name !== removeRole.subject.name,
        );
        roleWithMultipleSubjects.subjects = newSubs;
      } else {
        const newSubs = removeRole.subjects.filter((sub) => sub.name !== removeRole.subject.name);
        updateRolesWithMultipleSubjects.push({ ...removeRole, subjects: newSubs });
      }
      return true;
    }
    return false;
  });

  _.remove(updateRoles, (updateRole) => {
    if (updateRole.subjects.length > 1) {
      const roleWithMultipleSubjects = updateRolesWithMultipleSubjects.find(
        (r) => r.roleBindingName === updateRole.roleBindingName,
      );
      roleWithMultipleSubjects.subjects.push(updateRole.subject);
      return true;
    }
    return false;
  });
  return updateRolesWithMultipleSubjects;
};
