import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { restorePVCModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor, VolumeSnapshotKind } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';

export const useVolumeSnapshotActions = (
  volumeSnapshot: K8sResourceKind,
): [Action[], boolean, boolean] => {
  const [volumeSnapshotModel, inFlight] = useK8sModel(referenceFor(volumeSnapshot));
  const { t } = useTranslation();
  const isPartOfSnapshotGroup = React.useMemo(() => {
    return volumeSnapshot?.metadata?.ownerReferences?.some(
      (ref) => ref.kind === 'VolumeGroupSnapshot',
    );
  }, [volumeSnapshot]);

  const allActions = React.useMemo(() => {
    if (!volumeSnapshotModel || inFlight) {
      return [];
    }

    const RestorePVC: Action = {
      id: 'restore-pvc',
      label: t('console-app~Restore as new PVC'),
      cta: () =>
        restorePVCModal({
          kind: volumeSnapshotModel,
          resource: volumeSnapshot as VolumeSnapshotKind,
        }),
      disabled: !(volumeSnapshot as VolumeSnapshotKind)?.status?.readyToUse,
      tooltip: !(volumeSnapshot as VolumeSnapshotKind)?.status?.readyToUse
        ? t('console-app~Volume Snapshot is not Ready')
        : undefined,
      accessReview: asAccessReview(volumeSnapshotModel, volumeSnapshot, 'create'),
    };

    const actions = [RestorePVC, ...getCommonResourceActions(volumeSnapshotModel, volumeSnapshot)];

    if (isPartOfSnapshotGroup) {
      return actions.map((action) => {
        if (action.id === 'delete-resource') {
          return {
            ...action,
            disabled: true,
            disabledTooltip: t(
              'console-app~Cannot delete a snapshot that belongs to a VolumeGroupSnapshot. Delete the group instead.',
            ),
          };
        }
        return action;
      });
    }

    return actions;
  }, [t, volumeSnapshotModel, volumeSnapshot, inFlight, isPartOfSnapshotGroup]);

  return [allActions, !inFlight, undefined];
};
