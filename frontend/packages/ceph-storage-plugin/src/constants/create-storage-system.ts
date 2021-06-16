export enum StepsId {
  BackingStorage = 'backing-storage',
  CreateStorageClass = 'create-storage-class',
  CreateLocalVolumeSet = 'create-local-volume-set',
  CapacityAndNodes = 'capacity-and-nodes',
  SecurityAndNetwork = 'security-and-network',
  ConnectionDetails = 'connection-details',
  ReviewAndCreate = 'review-and-create',
}

export enum BackingStorageType {
  EXISTING = 'existing',
  LOCAL_DEVICES = 'local-devices',
  EXTERNAL = 'external',
}

export const RHCS = 'rhcs';
export const StorageClusterIdentifier = 'storagecluster.ocs.openshift.io/v1';
