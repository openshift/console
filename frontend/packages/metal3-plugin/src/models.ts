import { K8sKind } from '@console/internal/module/k8s';

export const BaremetalHostModel: K8sKind = {
  label: 'Bare Metal Host',
  labelPlural: 'Bare Metal Hosts',
  apiVersion: 'v1alpha1',
  path: 'baremetalhosts',
  apiGroup: 'metal3.io',
  plural: 'baremetalhosts',
  abbr: 'BMH',
  namespaced: true,
  kind: 'BareMetalHost',
  id: 'baremetalhost',
  crd: true,
};
