import { UserKind } from '@console/internal/module/k8s';

export const user: UserKind = {
  kind: 'User',
  apiVersion: 'user.openshift.io/v1',
  identities: null,
  metadata: {
    name: 'consoledeveloper',
    selfLink: '/apis/user.openshift.io/v1/users/kube%3Aadmin',
    uid: '53093d25-830b-4ab2-b723-ac8659b5a176',
  },
};
