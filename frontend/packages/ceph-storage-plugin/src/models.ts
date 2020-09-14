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
  label: 'Storage Cluster',
  labelPlural: 'Storage Clusters',
  apiVersion: 'v1',
  apiGroup: 'ocs.openshift.io',
  plural: 'storageclusters',
  abbr: 'OCS',
  namespaced: true,
  kind: 'StorageCluster',
  id: 'ocscluster',
  crd: true,
};

export const VolumeSnapshotModel: K8sKind = {
  label: 'Volume Snapshot',
  apiVersion: 'snapshot.storage.k8s.io/v1beta1',
  apiGroup: '',
  plural: 'volumesnapshots',
  abbr: 'VS',
  namespaced: true,
  kind: 'VolumeSnapshot',
  id: 'volumesnapshot',
  labelPlural: 'Volume Snapshots',
  crd: true,
};

export const CephBlockPoolModel: K8sKind = {
  label: 'Ceph Block Pool',
  labelPlural: 'Ceph Block Pools',
  apiVersion: 'v1',
  apiGroup: 'ceph.rook.io',
  plural: 'cephblockpools',
  abbr: 'CBP',
  namespaced: true,
  kind: 'CephBlockPool',
  id: 'cephblockpools',
  crd: true,
};

export const CephObjectStoreModel: K8sKind = {
  label: 'Ceph Object Store',
  labelPlural: 'Ceph Object Stores',
  apiVersion: 'v1',
  apiGroup: 'ceph.rook.io',
  plural: 'cephobjectstores',
  abbr: 'COS',
  namespaced: true,
  kind: 'CephObjectStore',
  id: 'cephobjectstores',
  crd: true,
};
