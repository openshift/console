import { Taint, Toleration } from '@console/internal/module/k8s';

export const ZONE_LABELS = [
  'topology.kubernetes.io/zone',
  'failure-domain.beta.kubernetes.io/zone', // deprecated
];

export const RACK_LABEL = 'topology.rook.io/rack';

export enum MODES {
  INTERNAL = 'Internal',
  ATTACHED_DEVICES = 'Internal - Attached Devices',
  EXTERNAL = 'External',
}

export enum OCS_PROVISIONER {
  BLOCK = 'openshift-storage.rbd.csi.ceph.com',
  FILE = 'openshift-storage.cephfs.csi.ceph.com',
}

export const OCS_PROVISIONERS = [
  'ceph.rook.io/block',
  'cephfs.csi.ceph.com',
  'rbd.csi.ceph.com',
  'noobaa.io/obc',
  'ceph.rook.io/bucket',
];

export enum CLUSTER_STATUS {
  READY = 'Ready',
  PROGRESSING = 'Progressing',
}

export enum defaultRequestSize {
  BAREMETAL = '1',
  NON_BAREMETAL = '2Ti',
}

export enum CreateStepsSC {
  DISCOVER = 'DISCOVER',
  STORAGECLASS = 'STORAGECLASS',
  STORAGEANDNODES = 'STORAGEANDNODES',
  CONFIGURE = 'CONFIGURE',
  REVIEWANDCREATE = 'REVIEWANDCREATE',
}

export const dropdownUnits = Object.freeze({
  GiB: 'Gi',
  TiB: 'Ti',
});

export const ocsTaint: Taint = Object.freeze({
  key: 'node.ocs.openshift.io/storage',
  value: 'true',
  effect: 'NoSchedule',
});

export const OCS_TOLERATION: Toleration = { ...ocsTaint, operator: 'Equal' };
