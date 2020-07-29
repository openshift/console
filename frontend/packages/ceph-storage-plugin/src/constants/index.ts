export * from './ocs-install';
export const CEPH_HEALTHY = 'is healthy';
export const CEPH_DEGRADED = 'health is degraded';
export const CEPH_ERROR = 'health is in error state';
export const CEPH_UNKNOWN = 'is not available';
export const CEPH_STORAGE_NAMESPACE = 'openshift-storage';
export const PROJECTS = 'Projects';
export const STORAGE_CLASSES = 'Storage Classes';
export const PODS = 'Pods';
export const BY_USED = 'By Used Capacity';
export const BY_REQUESTED = 'By Requested Capacity';
export const OCS_OPERATOR = 'ocs-operator';
export const OCS_EXTERNAL_CR_NAME = 'ocs-external-storagecluster';
export const OCS_INTERNAL_CR_NAME = 'ocs-storagecluster';
export const NO_PROVISIONER = 'kubernetes.io/no-provisioner';
export const OCS_SUPPORT_ANNOTATION = 'features.ocs.openshift.io/enabled';
export const OCS_DEVICE_SET_REPLICA = 3;
export const ATTACHED_DEVICES_ANNOTATION = 'cluster.ocs.openshift.io/local-devices';
export const AVAILABLE = 'Available';
export const dropdownUnits = {
  GiB: 'Gi',
  TiB: 'Ti',
};
export const CEPH_INTERNAL_CR_NAME = 'ocs-storagecluster-cephcluster';
export const CEPH_EXTERNAL_CR_NAME = 'ocs-external-storagecluster-cephcluster';

export enum OCS_PROVISIONER {
  BLOCK = 'openshift-storage.rbd.csi.ceph.com',
  FILE = 'openshift-storage.cephfs.csi.ceph.com',
}

export const OCS_DEVICE_REPLICA = Object.freeze({
  '2': '2-way',
  '3': '3-way',
});
export const RGW_PROVISIONER = 'openshift-storage.ceph.rook.io/bucket';
export const SECOND = 1000;

export enum MODES {
  INTERNAL = 'Internal',
  EXTERNAL = 'External',
  ATTACHED_DEVICES = 'Internal - Attached Devices',
}
