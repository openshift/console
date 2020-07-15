import { K8sResourceKind } from '@console/internal/module/k8s';
import { NO_PROVISIONER, OCS_INTERNAL_CR_NAME, CEPH_STORAGE_NAMESPACE } from '../../constants';

export const getOCSRequestData = (
  scName?: string,
  storage?: string,
  infra?: string,
): K8sResourceKind => {
  const requestData = {
    apiVersion: 'ocs.openshift.io/v1',
    kind: 'StorageCluster',
    metadata: {
      name: OCS_INTERNAL_CR_NAME,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    spec: {
      manageNodes: false,
      storageDeviceSets: [
        {
          name: 'ocs-deviceset',
          count: 1,
          replica: 3,
          resources: {},
          placement: {},
          portable: true,
          dataPVCTemplate: {
            spec: {
              storageClassName: scName,
              accessModes: ['ReadWriteOnce'],
              volumeMode: 'Block',
              resources: {
                requests: {
                  storage,
                },
              },
            },
          },
        },
      ],
    },
  } as K8sResourceKind;

  if (infra === NO_PROVISIONER) {
    requestData.spec.monDataDirHostPath = '/var/lib/rook';
    requestData.spec.storageDeviceSets[0].portable = false;
  }

  return requestData;
};
