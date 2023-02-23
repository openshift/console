import { K8sResourceCommon } from '@console/internal/module/k8s';

export enum Verb {
  Create = 'Create',
  Remove = 'Remove',
  Patch = 'Patch',
}

export type SubjectType = {
  apiGroup?: string;
  kind: string;
  name: string;
  namespace?: string;
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
