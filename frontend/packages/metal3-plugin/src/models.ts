import { K8sKind } from '@console/internal/module/k8s';

export const BareMetalHostModel: K8sKind = {
  label: 'Bare Metal Host',
  labelPlural: 'Bare Metal Hosts',
  apiVersion: 'v1alpha1',
  apiGroup: 'metal3.io',
  plural: 'baremetalhosts',
  abbr: 'BMH',
  namespaced: true,
  kind: 'BareMetalHost',
  id: 'baremetalhost',
  crd: true,
};

export const NodeMaintenanceModel: K8sKind = {
  label: 'Node Maintenance',
  labelPlural: 'Node Maintenances',
  apiVersion: 'v1beta1',
  apiGroup: 'nodemaintenance.kubevirt.io',
  plural: 'nodemaintenances',
  abbr: 'NM',
  namespaced: false,
  kind: 'NodeMaintenance',
  id: 'nodemaintenance',
  crd: true,
};
