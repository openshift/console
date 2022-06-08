import { K8sModel as K8sKind } from '@console/dynamic-plugin-sdk/src/api/common-types';

export const ServiceBindingModel: K8sKind = {
  id: 'servicebinding',
  kind: 'ServiceBinding',
  plural: 'servicebindings',
  label: 'ServiceBinding',
  // t('service-binding-plugin~ServiceBinding')
  labelKey: 'service-binding-plugin~ServiceBinding',
  labelPlural: 'ServiceBindings',
  // t('service-binding-plugin~ServiceBindings')
  labelPluralKey: 'service-binding-plugin~ServiceBindings',
  abbr: 'SB',
  apiGroup: 'binding.operators.coreos.com',
  apiVersion: 'v1alpha1',
  namespaced: true,
  crd: true,
};
