import { apiVersionForModel } from '@console/internal/module/k8s';
import { Payload } from './external-storage/types';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { NooBaaSystemModel, StorageSystemModel } from '../../models';

export const createSSPayload = (systemKind: string, systemName: string): Payload => {
  const { apiGroup, apiVersion, kind, plural } = StorageSystemModel;
  return {
    model: {
      apiGroup,
      apiVersion,
      kind,
      plural,
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
        kind: systemKind,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
    },
  };
};

export const createNoobaaPayload = (): Payload => {
  const { apiGroup, apiVersion, kind, plural } = NooBaaSystemModel;

  return {
    model: {
      apiGroup,
      apiVersion,
      kind,
      plural,
    },
    payload: {
      apiVersion,
      kind,
      metadata: { name: 'noobaa', namespace: CEPH_STORAGE_NAMESPACE },
      spec: {
        dbResources: { requests: { cpu: '0.1', memory: '1Gi' } },
        dbType: 'postgres',
        coreResources: {
          requests: {
            cpu: '0.1',
            memory: '1Gi',
          },
        },
      },
    },
  };
};
