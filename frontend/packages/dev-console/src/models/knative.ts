import { K8sKind } from '@console/internal/module/k8s';

export const KsServiceModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: 'v1alpha1',
  label: 'Service',
  labelPlural: 'Services',
  plural: 'services',
  abbr: 'KS',
  namespaced: true,
  kind: 'Service',
  id: 'service',
  crd: true,
};
