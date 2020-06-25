import { Taint } from '@console/internal/module/k8s';

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

export enum defaultRequestSize {
  BAREMETAL = '1',
  NON_BAREMETAL = '2Ti',
}
