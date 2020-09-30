export const OCS_OP = 'OpenShift Container Storage';
export const NS = 'openshift-storage';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;

export enum POD_NAME_PATTERNS {
  OCS = 'ocs-operator-',
  ROOK = 'rook-ceph-operator-',
  NOOBA_OPERATOR = 'noobaa-operator-',
  NOOBAA_CORE = 'noobaa-core-',
  ROOK_CEPH_MON = 'rook-ceph-mon',
  ROOK_CEPH_MGR = 'rook-ceph-mgr',
  CSI_CEPHFS = 'csi-cephfsplugin-',
  CSI_RBD = 'csi-rbdplugin-',
  ROOK_CEPH_MDS = 'rook-ceph-mds-ocs-storagecluster-cephfilesystem',
  ROOK_CEPH_OSD = 'rook-ceph-osd-',
  ROOK_CEPH_OSD_PREPARE = 'rook-ceph-osd-prepare-',
}

export enum STORAGE_CLASS_PATTERNS {
  RBD = 'ocs-storagecluster-ceph-rbd',
  FS = 'ocs-storagecluster-cephfs',
  NOOBAA = 'noobaa.io',
}

export enum CLUSTER_STATUS {
  READY = 'Ready',
  PROGRESSING = 'Progressing',
  HEALTH_ERROR = 'HEALTH_ERR',
}

export const OCS_NODE_LABEL = 'cluster.ocs.openshift.io/openshift-storage';
export const CATALOG_SRC = 'redhat-operators';

export const KIND = 'storagecluster';
export const EXPAND_WAIT = 15 * MINUTE;
export const CAPACITY_UNIT = 'TiB';
export const CAPACITY_VALUE = '2';
export const OCS_OPERATOR_NAME = 'ocs-operatorv4';
export const STORAGE_CLUSTER_NAME = 'ocs-storagecluster';
export const HOST = 'host';
export const ZONE = 'zone';
export const OSD = 'osd';

export const SUCCESS = 'Succeeded';
export const READY_FOR_USE = 'ready for use';

export const ocsTaint = Object.freeze({
  key: 'node.ocs.openshift.io/storage',
  value: 'true',
  effect: 'NoSchedule',
});

export enum VOLUME_ACCESS_MODES {
  RWO = 'ReadWriteOnce',
  RWX = 'ReadWriteMany',
  ROX = 'ReadOnlyMany',
}

export enum SIZE_UNITS {
  MI = 'Mi',
  GI = 'Gi',
  TI = 'Ti',
}

export enum PVC_STATUS {
  PENDING = 'Pending',
  BOUND = 'Bound',
}

export enum OCP_TEXT_STATUS {
  HEALTHY = 'healthy',
  DEGRADED = 'health is degraded',
  NOT_AVAILABLE = 'is not available',
}

export enum OCP_HEALTH_ICON_COLORS {
  GREEN = '#486b00',
  YELLOW = '#f0ab00',
  RED = '#c9190b',
  GREEN46 = '#3e8635',
}

export const EXAMPLE_PVC = {
  name: 'expample-pvc',
  namespace: NS,
  size: '5',
  sizeUnits: SIZE_UNITS.GI,
  storageClass: STORAGE_CLASS_PATTERNS.RBD,
  accessMode: VOLUME_ACCESS_MODES.RWO,
};

export const CHANNEL_43 = 'stable-4.3';
export const CHANNEL_44 = 'stable-4.4';
export const CHANNEL_45 = 'stable-4.5';

export const LSO_INFO_MSG = 'Local Storage Operator Not Installed';
export const SC_STEPS_NAME = {
  DISCOVERY: 'Discover Disks',
  STORAGECLASS: 'Create Storage Class',
  STORAGECLUSTER: 'Create Storage Cluster',
};
export const CONFIRM_MODAL_TITLE = 'Create Storage Class';
