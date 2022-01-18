import { K8sModel as K8sKind } from '@console/dynamic-plugin-sdk/src/api/common-types';

export const ServiceBindingModel: K8sKind = {
  id: 'servicebinding',
  kind: 'ServiceBinding',
  plural: 'servicebindings',
  label: 'ServiceBinding',
  labelPlural: 'ServiceBindings',
  abbr: 'SB',
  apiGroup: 'binding.operators.coreos.com',
  apiVersion: 'v1alpha1',
  namespaced: true,
  crd: true,
};
