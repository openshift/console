import { K8sResourceKind } from '@console/internal/module/k8s';

export const minSelectedNode = 3;
export const taintObj = {
  key: 'node.ocs.openshift.io/storage',
  value: 'true',
  effect: 'NoSchedule',
};

export const ocsRequestData: K8sResourceKind = {
  apiVersion: 'ocs.openshift.io/v1alpha1',
  kind: 'StorageCluster',
  metadata: {
    name: 'ocs-storagecluster',
    namespace: 'openshift-storage',
  },
  spec: {
    managedNodes: false,
    storageDeviceSets: [
      {
        name: 'ocs-deviceset',
        count: 3,
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
                storage: '1Ti',
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
