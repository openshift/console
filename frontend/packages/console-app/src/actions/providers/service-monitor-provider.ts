import { useMemo } from 'react';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

export const useServiceMonitorActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [actions, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.Edit,
    CommonActionCreator.Delete,
  ] as const);
  const serviceMonitorActions = useMemo(() => (isReady ? Object.values(actions) : []), [
    actions,
    isReady,
  ]);

  return [serviceMonitorActions, !inFlight, false];
};
