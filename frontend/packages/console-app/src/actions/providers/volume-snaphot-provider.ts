import * as React from 'react';
import { useVolumeSnapshotActions } from '@console/app/src/actions/hooks/useVolumeSnapshotActions';
import { VolumeSnapshotKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';

export const useVolumeSnapshotActionsProvider = (resource: VolumeSnapshotKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const volumeSnapshotActions = useVolumeSnapshotActions(kindObj, resource);
  const actions = React.useMemo(() => {
    return [...volumeSnapshotActions, ...getCommonResourceActions(kindObj, resource)];
  }, [kindObj, volumeSnapshotActions, resource]);

  return [actions, !inFlight, undefined];
};
