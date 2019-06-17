import { K8sKind } from '@console/internal/module/k8s';

export const FooBarModel: K8sKind = {
  apiGroup: 'test.io',
  apiVersion: 'v1alpha1',
  kind: 'FooBar',
  label: 'Foo Bar',
  labelPlural: 'Foo Bars',
  plural: 'foobars',
  abbr: 'FOOBAR',
  namespaced: true,
  id: 'foobar',
  crd: true,
};
