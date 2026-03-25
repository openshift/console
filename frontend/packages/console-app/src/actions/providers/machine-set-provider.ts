import { useMemo } from 'react';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { MachineSetKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { useMachineSetActions } from '../hooks/useMachineSetActions';

export const useMachineSetActionsProvider = (
  resource: MachineSetKind,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const machineSetSpecificActions = useMachineSetActions(resource);
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = useMemo<Action[]>(() => [...machineSetSpecificActions, ...commonActions], [
    machineSetSpecificActions,
    commonActions,
  ]);

  return [actions, !inFlight, false];
};

export const machineSetProvider = {
  useMachineSetActionsProvider,
};
