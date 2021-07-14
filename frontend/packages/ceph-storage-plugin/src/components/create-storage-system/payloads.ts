import { apiVersionForModel } from '@console/internal/module/k8s';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { StorageSystemKind } from '../../types';
import { StorageSystemModel } from '../../models';

export const createSSPayload = (kind: string, name: string): StorageSystemKind => ({
  apiVersion: apiVersionForModel(StorageSystemModel),
  kind: StorageSystemModel.kind,
  metadata: {
    name: `odf-${name}-storage-system`,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
  spec: {
    name: `odf-${name}-storage-system`,
    kind,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
});
