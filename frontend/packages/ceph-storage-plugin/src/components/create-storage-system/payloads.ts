import { apiVersionForModel } from '@console/internal/module/k8s';
import { Payload } from './external-storage/types';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { StorageSystemModel } from '../../models';

export const createSSPayload = (systemKind: string, systemName: string): Payload => {
  const { apiGroup, apiVersion, kind } = StorageSystemModel;
  return {
    model: {
      group: apiGroup,
      version: apiVersion,
      kind,
    },
    payload: {
      apiVersion: apiVersionForModel(StorageSystemModel),
      kind,
      metadata: {
        name: systemName,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
      spec: {
        name: systemName,
        mame: systemKind,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
    },
  };
};
