import * as _ from 'lodash';
import { k8sCreate, k8sKill, k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { RoleBindingModel } from '@console/internal/models';
import { generateSecret } from '../import/import-submit-utils';
import { Verb, UserRoleBinding } from './project-access-form-utils-types';

export const getRolesWithNameChange = (
  newRoles: UserRoleBinding[],
  removeRoles: UserRoleBinding[],
) => {
  const createRoles = _.filter(newRoles, 'roleBindingName');
  const deleteRoles = _.filter(removeRoles, (o1) =>
    createRoles.find((o2) => o1.roleBindingName === o2.roleBindingName),
  );
  const rolesWithNameChange = _.filter(createRoles, (o1) =>
    deleteRoles.find(
      (o2) =>
        o1.roleBindingName === o2.roleBindingName && o1.user !== o2.user && o1.role === o2.role,
    ),
  );
  return rolesWithNameChange;
};

export const sendK8sRequest = (verb: string, roleBinding): Promise<K8sResourceKind> => {
  switch (verb) {
    case Verb.Create:
      return k8sCreate(RoleBindingModel, roleBinding);
    case Verb.Remove:
      return k8sKill(RoleBindingModel, roleBinding);
    case Verb.Patch:
      return k8sPatch(RoleBindingModel, { metadata: roleBinding.metadata }, [
        { op: 'replace', path: `/subjects/0`, value: roleBinding.subjects[0] },
      ]);
    default:
      return null;
  }
};

export const generateRoleBindingName = (username: string, role: string) => {
  return `${username}-${role}-${generateSecret()}`;
};

export const getNewRoles = (initialRoles: UserRoleBinding[], formValues: UserRoleBinding[]) => {
  const newRoles = _.uniqBy(
    _.filter(
      formValues,
      (o1) => !initialRoles.find((o2) => o1.user === o2.user && o1.role === o2.role),
    ),
    function(user) {
      return JSON.stringify([user.user, user.role]);
    },
  );
  return newRoles;
};

export const getRemovedRoles = (initialRoles: UserRoleBinding[], formValues: UserRoleBinding[]) => {
  const removeRoles = _.filter(
    initialRoles,
    (o1) => !formValues.find((o2: UserRoleBinding) => o1.user === o2.user && o1.role === o2.role),
  );
  return removeRoles;
};

export const sendRoleBindingRequest = (verb: string, roles: UserRoleBinding[], roleBinding) => {
  const finalArray = [];
  _.forEach(roles, (user) => {
    const roleBindingName =
      verb === Verb.Create ? generateRoleBindingName(user.user, user.role) : user.roleBindingName;
    roleBinding.subjects[0].name = user.user;
    roleBinding.roleRef.name = user.role;
    roleBinding.metadata.name = roleBindingName;
    finalArray.push(sendK8sRequest(verb, roleBinding));
  });
  return finalArray;
};
