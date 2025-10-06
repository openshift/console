import { useMemo } from 'react';
import { Action } from '@console/dynamic-plugin-sdk';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useCommonActionsProvider = (
  resource: K8sResourceKind,
): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = useMemo(() => [...commonActions], [commonActions]);
  return [actions, !inFlight, false];
};
