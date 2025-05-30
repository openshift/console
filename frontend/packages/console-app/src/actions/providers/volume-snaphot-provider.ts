import * as React from 'react';
import { useVolumeSnapshotActionFactory } from '@console/app/src/actions/creators/volume-snapshot-factory';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';

export const useVolumeSnapshotActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actionFactory = useVolumeSnapshotActionFactory();
  const actions = React.useMemo(() => {
    return [
      actionFactory.RestorePVC(kindObj, resource),
      ...getCommonResourceActions(kindObj, resource),
    ];
  }, [kindObj, actionFactory, resource]);

  return [actions, !inFlight, undefined];
};
