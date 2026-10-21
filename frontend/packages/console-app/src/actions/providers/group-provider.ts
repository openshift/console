import { useMemo } from 'react';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { GroupKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { useGroupActions } from '../hooks/useGroupActions';

export const useGroupActionsProvider = (resource: GroupKind): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const groupSpecificActions = useGroupActions(resource);
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = useMemo<Action[]>(() => [...groupSpecificActions, ...commonActions], [
    groupSpecificActions,
    commonActions,
  ]);

  return [actions, !inFlight, false];
};
