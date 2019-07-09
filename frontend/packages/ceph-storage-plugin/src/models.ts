import { K8sKind } from '@console/internal/module/k8s';

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

export const OCSServiceModel: K8sKind = {
  label: 'OCS Cluster Service',
  labelPlural: 'OCS Cluster Services',
  apiVersion: 'v1alpha1',
  apiGroup: 'ocs.openshift.io',
  plural: 'ocsclusters',
  abbr: 'OCS',
  namespaced: true,
  kind: 'StorageCluster',
  id: 'ipiocscluster',
  crd: true,
};
