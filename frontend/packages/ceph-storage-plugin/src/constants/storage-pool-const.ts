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
}

export const MODAL_TITLE = 'Create New Storage Pool';
export const COMPRESSION_ON = 'aggressive';
export const ROOK_MODEL = 'cephblockpools.ceph.rook.io';

export const MODAL_DESC =
  'A Storage pool is a logical entity providing elastic capacity to applications and workloads. Pools provide a means of supporting policies for access, data resilience and storage efficiency.';

export const NOT_READY_DESC =
  'The creation of an OCS storage cluster is still in progress or have failed, please try again after the storage cluster is ready to use.';
