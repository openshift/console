import { K8sKind } from '@console/internal/module/k8s';

export const ServiceBindingModel: K8sKind = {
  id: 'servicebinding',
  kind: 'ServiceBinding',
  plural: 'servicebindings',
  label: 'ServiceBinding',
  labelPlural: 'ServiceBindings',
  abbr: 'SB',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  namespaced: true,
  crd: true,
};
