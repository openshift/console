import i18next from 'i18next';
import {
  clonePVCModal,
  expandPVCModal,
  restorePVCModal,
} from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotModel } from '@console/internal/models';
import { VolumeSnapshotKind } from '@console/internal/module/k8s';
import { ResourceActionFactory } from './common-factory';

export const PVCActionFactory: ResourceActionFactory = {
  ExpandPVC: (kind, obj) => ({
    id: 'expand-pvc-action',
    label: i18next.t('console-app~Expand PVC'),
    cta: () =>
      expandPVCModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  PVCSnapshot: (kind, obj) => ({
    id: 'create-snapshot-action',
    label: i18next.t('console-app~Create snapshot'),
    disabled: obj?.status?.phase !== 'Bound',
    tooltip: obj?.status?.phase !== 'Bound' ? 'PVC is not Bound' : '',
    cta: {
      href: `/k8s/ns/${obj.metadata.namespace}/${VolumeSnapshotModel.plural}/~new/form?pvc=${obj.metadata.name}`,
    },
    accessReview: asAccessReview(kind, obj, 'create'),
  }),
  ClonePVC: (kind, obj) => ({
    id: 'clone-pvc-action',
    label: i18next.t('console-app~Clone PVC'),
    disabled: obj?.status?.phase !== 'Bound',
    tooltip: obj?.status?.phase !== 'Bound' ? 'PVC is not Bound' : '',
    cta: () =>
      clonePVCModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'create'),
  }),
  RestorePVC: (kind, obj: VolumeSnapshotKind) => ({
    id: 'clone-pvc-action',
    label: i18next.t('console-app~Restore as new PVC'),
    disabled: !obj?.status?.readyToUse,
    tooltip: !obj?.status?.readyToUse ? 'Volume Snapshot is not Ready' : '',
    cta: () =>
      restorePVCModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'create'),
  }),
};
