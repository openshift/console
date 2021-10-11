import i18next from 'i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Action } from '@console/dynamic-plugin-sdk';
import {
  addCapacityModal,
  addSSCapacityModal,
} from '../components/modals/add-capacity-modal/add-capacity-modal';
import { updateBlockPoolModal } from '../components/modals/block-pool-modal/update-block-pool-modal';
import editBucketClassModal from '../components/bucket-class/modals/edit-backingstore-modal';
import { StoragePoolKind, StorageSystemKind } from '../types';

export const CephStorageCSVActions = {
  AddCapacity: (resource: K8sResourceKind): Action => {
    return {
      id: 'add-capacity',
      label: i18next.t('ceph-storage-plugin~Add Capacity'),
      insertBefore: 'edit-csv',
      cta: () => {
        addCapacityModal({ ocsConfig: resource });
      },
    };
  },
  EditBlackPool: (resource: StoragePoolKind): Action => {
    return {
      id: 'edit-block-pool',
      label: i18next.t('ceph-storage-plugin~Edit BlockPool'),
      insertBefore: 'edit-csv',
      cta: () => {
        updateBlockPoolModal({ blockPoolConfig: resource });
      },
    };
  },
  EditBucketClassResources: (resource): Action => {
    return {
      id: 'edit-bucket-class',
      label: i18next.t('ceph-storage-plugin~Edit Bucket Class Resources'),
      insertBefore: 'edit-csv',
      cta: () => {
        editBucketClassModal({ bucketClass: resource, modalClassName: 'nb-modal' });
      },
    };
  },
};

export const AddCapacityStorageSystem = (resource: StorageSystemKind): Action => {
  return {
    id: 'add-capacity-storage-system',
    label: i18next.t('ceph-storage-plugin~Add Capacity'),
    insertBefore: 'edit-csv',
    cta: () => {
      addSSCapacityModal({ storageSystem: resource });
    },
  };
};
