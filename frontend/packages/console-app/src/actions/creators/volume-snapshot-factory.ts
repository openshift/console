import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { restorePVCModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotKind, K8sModel } from '@console/internal/module/k8s';
import { ResourceActionFactory } from './types';

/**
 * A React hook for creating actions related to VolumeSnapshots.
 *
 * @returns {ResourceActionFactory} An object containing the action factory used to generate
 * all actions specific to VolumeSnaphots.
 *
 * @example
 * // Getting actions for VolumeSnapshot resources
 * const MyVolumeSnapshotComponent = ({ kind, obj }) => {
 * const factory = useVolumeSnapshotActionFactory();
 * return <Kebab actions={factory.RestorePVC(kind, obj)} />;
 * };
 */
export const useVolumeSnapshotActionFactory = (): ResourceActionFactory => {
  const { t } = useTranslation();
  return React.useMemo(
    () => ({
      RestorePVC: (kind: K8sModel, obj: VolumeSnapshotKind) => ({
        id: 'clone-pvc',
        label: t('console-app~Restore as new PVC'),
        disabled: !obj?.status?.readyToUse,
        tooltip: !obj?.status?.readyToUse ? t('console-app~Volume Snapshot is not Ready') : '',
        cta: () =>
          restorePVCModal({
            kind,
            obj,
          }),
        accessReview: asAccessReview(kind, obj, 'create'),
      }),
    }),
    [t],
  );
};
