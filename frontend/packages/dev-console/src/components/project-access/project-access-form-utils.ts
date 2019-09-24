import * as _ from 'lodash';
import { UserRoleBinding, UserRole } from './project-access-form-utils-types';

export const filterRoleBindings = (roleBindings, roles) => {
  return _.filter(roleBindings.data, (user: UserRole) => _.keys(roles).includes(user.roleRef.name));
};

export const getUserRoleBindings = (roleBindings) => {
  let userRoleBindings: UserRoleBinding[] = [];
  roleBindings.map(
    (user: UserRole) =>
      (userRoleBindings = [
        ...userRoleBindings,
        ...[
          {
            roleBindingName: user.metadata.name,
            user: user.subjects[0].name,
            role: user.roleRef.name,
          },
        ],
      ]),
  );
  return userRoleBindings;
};
