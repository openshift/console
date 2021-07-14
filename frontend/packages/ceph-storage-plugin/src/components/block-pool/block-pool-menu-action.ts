import i18next from 'i18next';

import { asAccessReview } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

import { updateBlockPoolModal } from '../modals/block-pool-modal/update-block-pool-modal';
import { deleteBlockPoolModal } from '../modals/block-pool-modal/delete-block-pool-modal';

const editBlockPool = (kind: K8sKind, blockPoolConfig: K8sResourceKind) => ({
  labelKey: i18next.t('ceph-storage-plugin~Edit BlockPool'),
  callback: () => updateBlockPoolModal({ kind, blockPoolConfig }),
  accessReview: asAccessReview(kind, blockPoolConfig, 'patch'),
});

const deleteBlockPool = (kind: K8sKind, blockPoolConfig: K8sResourceKind) => ({
  labelKey: i18next.t('ceph-storage-plugin~Delete BlockPool'),
  callback: () => deleteBlockPoolModal({ kind, blockPoolConfig }),
  accessReview: asAccessReview(kind, blockPoolConfig, 'patch'),
});

export const menuActions = [editBlockPool, deleteBlockPool];

export const menuActionCreator = (kindObj: K8sKind, blockPoolConfig: K8sResourceKind) =>
  menuActions.map((action) => action(kindObj, blockPoolConfig));
