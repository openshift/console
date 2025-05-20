import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { clonePVCModal, expandPVCModal } from '@console/internal/components/modals';
import deletePVCModal from '@console/internal/components/modals/delete-pvc-modal';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, K8sModel } from '@console/internal/module/k8s';
import { ResourceActionFactory } from './types';

const usePVCActionFactory = (): ResourceActionFactory => {
  const { t } = useTranslation();

  const factory = React.useMemo(() => {
    return {
      ExpandPVC: (kind: K8sModel, obj: PersistentVolumeClaimKind) => ({
        id: 'expand-pvc',
        label: t('console-app~Expand PVC'),
        cta: () =>
          expandPVCModal({
            kind,
            resource: obj,
          }),
        accessReview: asAccessReview(kind, obj, 'patch'),
      }),
      PVCSnapshot: (kind: K8sModel, obj: PersistentVolumeClaimKind) => ({
        id: 'create-snapshot',
        label: t('console-app~Create snapshot'),
        disabled: obj?.status?.phase !== 'Bound',
        tooltip: obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: {
          href: `/k8s/ns/${obj.metadata.namespace}/${VolumeSnapshotModel.plural}/~new/form?pvc=${obj.metadata.name}`,
        },
        accessReview: asAccessReview(kind, obj, 'create'),
      }),
      ClonePVC: (kind: K8sModel, obj: PersistentVolumeClaimKind) => ({
        id: 'clone-pvc',
        label: t('console-app~Clone PVC'),
        disabled: obj?.status?.phase !== 'Bound',
        tooltip: obj?.status?.phase !== 'Bound' ? t('console-app~PVC is not Bound') : '',
        cta: () =>
          clonePVCModal({
            kind,
            resource: obj,
          }),
        accessReview: asAccessReview(kind, obj, 'create'),
      }),
      DeletePVC: (kind: K8sModel, obj: PersistentVolumeClaimKind) => ({
        id: 'delete-pvc',
        label: t('public~Delete PersistentVolumeClaim'),
        cta: () =>
          deletePVCModal({
            pvc: obj,
          }),
        accessReview: asAccessReview(kind, obj, 'delete'),
      }),
    };
  }, [t]);
  return factory;
};

export const usePVCActions = (kind: K8sModel, obj: PersistentVolumeClaimKind) => {
  const actionFactory = usePVCActionFactory();
  const actions = React.useMemo(() => {
    return [
      actionFactory.ExpandPVC(kind, obj),
      actionFactory.PVCSnapshot(kind, obj),
      actionFactory.ClonePVC(kind, obj),
      actionFactory.DeletePVC(kind, obj),
    ];
  }, [kind, obj, actionFactory]);
  return actions;
};
