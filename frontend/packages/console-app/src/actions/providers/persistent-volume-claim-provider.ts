import * as React from 'react';
import { CommonActionFactory } from '@console/app/src/actions/creators/common-factory';
import { usePVCActions } from '@console/app/src/actions/creators/pvc-factory';
import { Action } from '@console/dynamic-plugin-sdk';
import { referenceFor, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const usePVCActionsProvider = (
  resource: PersistentVolumeClaimKind,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actionsPVC = usePVCActions(kindObj, resource);
  const actions = React.useMemo(
    () => [
      ...actionsPVC,
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      CommonActionFactory.Edit(kindObj, resource),
    ],
    [kindObj, actionsPVC, resource],
  );
  return [actions, !inFlight, undefined];
};
