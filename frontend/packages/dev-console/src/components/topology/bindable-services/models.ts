import { K8sKind } from '@console/internal/module/k8s';

export const BindableServicesModel: K8sKind = {
  apiGroup: 'binding.operators.coreos.com',
  apiVersion: 'v1alpha1',
  kind: 'BindableService',
  plural: 'bindableservices',
  label: 'BindableService',
  // t('devconsole~BindableService')
  labelKey: 'BindableService',
  labelPlural: 'devconsole~BindableServices',
  // t('devconsole~BindableServices')
  labelPluralKey: 'devconsole~BindableServices',
  abbr: 'BS',
  crd: true,
  namespaced: false,
};
