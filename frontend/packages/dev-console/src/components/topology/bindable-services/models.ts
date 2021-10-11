import { K8sKind } from '@console/internal/module/k8s';

export const BindableServicesModel: K8sKind = {
  apiGroup: 'binding.operators.coreos.com',
  apiVersion: 'v1alpha1',
  kind: 'BindableKinds',
  plural: 'bindablekinds',
  label: 'BindableKinds',
  // t('devconsole~BindableKinds')
  labelKey: 'BindableKinds',
  labelPlural: 'devconsole~BindableKinds',
  labelPluralKey: 'devconsole~BindableKinds',
  abbr: 'BK',
  crd: true,
  namespaced: false,
};
