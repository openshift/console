import { useMemo } from 'react';
import { useVolumeSnapshotActions } from '@console/app/src/actions/hooks/useVolumeSnapshotActions';
import type { VolumeSnapshotKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useVolumeSnapshotActionsProvider = (resource: VolumeSnapshotKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const volumeSnapshotActions = useVolumeSnapshotActions(resource);
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = useMemo(() => {
    return [...volumeSnapshotActions, ...commonActions];
  }, [volumeSnapshotActions, commonActions]);

  return [actions, !inFlight, undefined];
};
