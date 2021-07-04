import { TFunction } from 'i18next';

import { asAccessReview } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';

import { StoragePoolKind } from '../../types';
import { updateBlockPoolModal } from '../modals/block-pool-modal/update-block-pool-modal';
import { deleteBlockPoolModal } from '../modals/block-pool-modal/delete-block-pool-modal';

const editBlockPool = (kindObj: K8sKind, blockPoolConfig: StoragePoolKind, _, customData) => {
  const t: TFunction = customData?.tFunction;
  return {
    labelKey: t('ceph-storage-plugin~Edit BlockPool'),
    callback: () => updateBlockPoolModal({ kindObj, blockPoolConfig }),
    accessReview: asAccessReview(kindObj, blockPoolConfig, 'patch'),
  };
};

const deleteBlockPool = (kindObj: K8sKind, blockPoolConfig: StoragePoolKind, _, customData) => {
  const t: TFunction = customData?.tFunction;
  return {
    labelKey: t('ceph-storage-plugin~Delete BlockPool'),
    callback: () => deleteBlockPoolModal({ kindObj, blockPoolConfig }),
    accessReview: asAccessReview(kindObj, blockPoolConfig, 'patch'),
  };
};

export const menuActions = [editBlockPool, deleteBlockPool];
