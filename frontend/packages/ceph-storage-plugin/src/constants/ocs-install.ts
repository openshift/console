import { Taint } from '@console/internal/module/k8s';

export const MINIMUM_NODES = 3;
export const ocsTaint: Taint = {
  key: 'node.ocs.openshift.io/storage',
  value: 'true',
  effect: 'NoSchedule',
};
Object.freeze(ocsTaint);

export const storageClassTooltip =
  'The Storage Class will be used to request storage from the underlying infrastructure to create the backing persistent volumes that will be used to provide the OpenShift Container Storage (OCS) service.';
export const requestedCapacityTooltip =
  'The backing storage requested will be higher as it will factor in the requested capacity, replica factor, and fault tolerant costs associated with the requested capacity.';

export enum defaultRequestSize {
  BAREMETAL = '1',
  NON_BAREMETAL = '2Ti',
}

export enum CreateStepsSC {
  DISCOVER = 'DISCOVER',
  STORAGECLASS = 'STORAGECLASS',
  STORAGEANDNODES = 'STORAGEANDNODES',
  CONFIGURE = 'CONFIGURE',
  REVIEWANDCREATE = 'REVIEWANDCREATE',
}

export const diskModeDropdownItems = Object.freeze({
  BLOCK: 'Block',
});

export const diskTypeDropdownItems = Object.freeze({
  SSD: 'SSD / NVMe',
});

export const allNodesSelectorTxt =
  'Selecting all nodes will use the available disks that match the selected filters on all nodes selected on previous step.';

export enum IP_FAMILY {
  IPV4 = 'IPV4',
  IPV6 = 'IPV6',
}
