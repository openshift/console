import { CEPH_STORAGE_NAMESPACE } from '@console/ceph-storage-plugin/src/constants';
import { SecretModel } from '@console/internal/models';
import { FirehoseResource } from '@console/internal/components/utils';

export const secretResource: FirehoseResource = {
  isList: false,
  kind: SecretModel.kind,
  prop: 'secret',
  namespace: CEPH_STORAGE_NAMESPACE,
  name: 'rook-ceph-external-cluster-details',
};
