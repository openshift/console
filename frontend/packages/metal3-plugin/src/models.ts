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
  apiGroup: 'nodemaintenance.medik8s.io',
  plural: 'nodemaintenances',
  abbr: 'NM',
  namespaced: false,
  kind: 'NodeMaintenance',
  id: 'nodemaintenance',
  crd: true,
};

export const NodeMaintenanceKubevirtBetaModel: K8sKind = {
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

export const ProvisioningModel: K8sKind = {
  label: 'Provisioning',
  labelPlural: 'Provisionings',
  apiVersion: 'v1alpha1',
  apiGroup: 'metal3.io',
  plural: 'provisionings',
  abbr: 'P',
  namespaced: false,
  kind: 'Provisioning',
  id: 'provisioning',
  crd: true,
};

export const NodeMaintenanceKubevirtAlphaModel: K8sKind = {
  label: 'Node Maintenance',
  labelPlural: 'Node Maintenances',
  apiVersion: 'v1alpha1',
  apiGroup: 'kubevirt.io',
  plural: 'nodemaintenances',
  abbr: 'NM',
  namespaced: false,
  kind: 'NodeMaintenance',
  id: 'nodemaintenance',
  crd: true,
};

export const CephClusterModel: K8sKind = {
  label: 'Ceph Cluster',
  labelPlural: 'Ceph Clusters',
  apiVersion: 'v1',
  apiGroup: 'ceph.rook.io',
  plural: 'cephclusters',
  abbr: 'CC',
  namespaced: true,
  kind: 'CephCluster',
  id: 'cephcluster',
  crd: true,
};
