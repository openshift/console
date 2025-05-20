import * as React from 'react';
import i18next from 'i18next';
import { restorePVCModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const useVolumeSnapshotActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const actions = React.useMemo(
    () => [
      {
        id: 'clone-pvc',
        label: i18next.t('console-app~Restore as new PVC'),
        disabled: !resource?.status?.readyToUse,
        tooltip: !resource?.status?.readyToUse
          ? i18next.t('console-app~Volume Snapshot is not Ready')
          : '',
        cta: () =>
          restorePVCModal({
            kindObj,
            resource,
          }),
        accessReview: asAccessReview(kindObj, resource, 'create'),
      },
    ],
    [kindObj, resource],
  );

  return [actions, !inFlight, undefined];
};
