import { TFunction } from 'i18next';

export enum Steps {
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

export const StepsName = (t: TFunction) => ({
  [Steps.CapacityAndNodes]: t('ceph-storage-plugin~Capacity and nodes'),
  [Steps.BackingStorage]: t('ceph-storage-plugin~Backing storage'),
  [Steps.CreateStorageClass]: t('ceph-storage-plugin~Create storage class'),
  [Steps.CreateLocalVolumeSet]: t('ceph-storage-plugin~Create local volume set'),
  [Steps.ReviewAndCreate]: t('ceph-storage-plugin~Review and create'),
  [Steps.SecurityAndNetwork]: t('ceph-storage-plugin~Security and network'),
  [Steps.ConnectionDetails]: t('ceph-storage-plugin~Connection details'),
});

export const StorageClusterIdentifier = 'storagecluster.ocs.openshift.io/v1';
