import { K8sResourceCommon } from '@console/internal/module/k8s';

export enum Verb {
  Create = 'Create',
  Remove = 'Remove',
  Patch = 'Patch',
}

type SubjectType = {
  apiGroup?: string;
  kind: string;
  name: string;
};

export type UserRoleBinding = {
  roleBindingName?: string;
  role: string;
  subject: SubjectType;
  subjects: SubjectType[];
};

export type RoleBinding = K8sResourceCommon & {
  roleRef: SubjectType;
  subjects?: SubjectType[];
};

export const roleBinding: RoleBinding = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'RoleBinding',
  metadata: {
    name: '',
    namespace: '',
  },
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: '',
  },
  subjects: [],
};
