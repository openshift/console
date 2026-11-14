import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVolumeGroupSnapshotActions } from '@console/app/src/actions/hooks/useVolumeGroupSnapshotActions';
import type { VolumeGroupSnapshotKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useVolumeGroupSnapshotActionsProvider = (resource: VolumeGroupSnapshotKind) => {
  const { t } = useTranslation('console-app');
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const volumeGroupSnapshotActions = useVolumeGroupSnapshotActions(resource);
  const deleteMessage = t(
    'Deleting this VolumeGroupSnapshot will also delete all VolumeSnapshots that belong to this group.',
  );
  const commonActions = useCommonResourceActions(kindObj, resource, deleteMessage);
  const actions = useMemo(
    () => [...volumeGroupSnapshotActions, ...commonActions],
    [volumeGroupSnapshotActions, commonActions],
  );

  return [actions, !inFlight, undefined];
};
