import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { restorePVCModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { VolumeSnapshotKind, K8sModel } from '@console/internal/module/k8s';
import { ResourceActionFactory } from './types';

export const useVolumeSnapshotActionFactory = (): ResourceActionFactory => {
  const { t } = useTranslation();
  const factory = React.useMemo(() => {
    return {
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
    };
  }, [t]);
  return factory;
};
