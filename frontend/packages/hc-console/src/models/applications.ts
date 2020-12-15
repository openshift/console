import { K8sKind } from '@console/internal/module/k8s';

export const ApplicationModel: K8sKind = {
  id: 'application',
  kind: 'application',
  plural: 'applications',
  label: 'Application',
  labelPlural: 'Applications',
  abbr: 'A',
  apiGroup: '',
  apiVersion: '',
  namespaced: true,
  crd: false,
};
