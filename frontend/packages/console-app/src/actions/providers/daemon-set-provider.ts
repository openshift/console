import { useMemo } from 'react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { usePDBActions } from '../hooks/usePDBActions';

export const useDaemonSetActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [addStorageAction] = useCommonActions(kindObj, resource, [
    CommonActionCreator.AddStorage,
  ] as const);
  const commonResourceActions = useCommonResourceActions(kindObj, resource);
  const actions = useMemo(
    () => [
      getHealthChecksAction(kindObj, resource),
      ...pdbActions,
      ...Object.values(addStorageAction),
      ...commonResourceActions,
    ],
    [kindObj, resource, pdbActions, addStorageAction, commonResourceActions],
  );

  return [actions, !inFlight, undefined];
};
