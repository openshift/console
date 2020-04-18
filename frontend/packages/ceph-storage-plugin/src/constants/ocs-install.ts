import { K8sResourceKind, Taint } from '@console/internal/module/k8s';

export const minSelectedNode = 3;
export const ocsTaint: Taint = {
  key: 'node.ocs.openshift.io/storage',
  value: 'true',
  effect: 'NoSchedule',
};
Object.freeze(ocsTaint);

export const storageClassTooltip =
  'The Storage Class will be used to request storage from the underlying infrastructure to create the backing persistent volumes that will be used to provide the OpenShift Container Storage (OCS) service.';
export const labelTooltip =
  'The backing storage requested will be higher as it will factor in the requested capacity, replica factor, and fault tolerant costs associated with the requested capacity.';

export const ocsRequestData: K8sResourceKind = {
  apiVersion: 'ocs.openshift.io/v1',
  kind: 'StorageCluster',
  metadata: {
    name: 'ocs-storagecluster',
    namespace: 'openshift-storage',
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
            storageClassName: '',
            accessModes: ['ReadWriteOnce'],
            volumeMode: 'Block',
            resources: {
              requests: {
                storage: '',
              },
            },
          },
        },
      },
    ],
  },
};

export const infraProvisionerMap = {
  aws: 'kubernetes.io/aws-ebs',
  vsphere: 'kubernetes.io/vsphere-volume',
};

export enum defaultRequestSize {
  BAREMETAL = '1',
  NON_BAREMETAL = '2Ti',
}
