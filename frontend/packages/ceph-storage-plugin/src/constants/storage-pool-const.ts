export enum POOL_STATE {
  READY = 'Ready',
  FAILED = 'ReconcileFailed',
}

export enum POOL_PROGRESS {
  CREATED = 'created',
  FAILED = 'failed',
  PROGRESS = 'progress',
  TIMEOUT = 'timeout',
  NOTREADY = 'notReady',
  NOTALLOWED = 'notAllowed',
  BOUNDED = 'bounded',
}

export const COMPRESSION_ON = 'aggressive';
export const ROOK_MODEL = 'cephblockpools.ceph.rook.io';
export const CEPH_DEFAULT_BLOCK_POOL_NAME = 'ocs-storagecluster-cephblockpool';
