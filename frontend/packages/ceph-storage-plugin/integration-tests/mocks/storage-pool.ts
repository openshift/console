import { StoragePoolKind } from '../../src/types';
import { NS } from '../utils/consts';

export const poolData: StoragePoolKind = {
  apiVersion: 'ceph.rook.io/v1',
  kind: 'CephBlockPool',
  metadata: {
    name: 'foo',
    namespace: NS,
  },
  spec: {
    failureDomain: '',
    compressionMode: '',
    replicated: {
      size: 2,
    },
  },
};
