import { TFunction } from 'i18next';

import { asAccessReview } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';

import { StoragePoolKind, CephClusterKind } from '../../types';
import { updateBlockPoolModal } from '../modals/block-pool-modal/update-block-pool-modal';
import { deleteBlockPoolModal } from '../modals/block-pool-modal/delete-block-pool-modal';
import { CEPH_EXTERNAL_CR_NAME } from '../../constants';
import { isDefaultPool } from '../../utils/block-pool';

export const disableMenuAction = (blockPoolConfig: StoragePoolKind, cephCluster: CephClusterKind) =>
  blockPoolConfig?.metadata?.deletionTimestamp ||
  cephCluster?.metadata?.name === CEPH_EXTERNAL_CR_NAME ||
  isDefaultPool(blockPoolConfig);

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

export const menuActionCreator = (
  kindObj: K8sKind,
  blockPoolConfig: StoragePoolKind,
  resource?: any,
  customData?: any,
) => {
  if (!disableMenuAction(blockPoolConfig, customData?.cephCluster))
    return menuActions.map((action) => action(kindObj, blockPoolConfig, resource, customData));
  return [];
};
