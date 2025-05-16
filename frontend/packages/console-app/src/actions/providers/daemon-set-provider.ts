import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonAction } from '../hooks/useCommonAction';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useDaemonSetActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const addStorageAction = useCommonAction(kindObj, resource, CommonActionCreator.AddStorage);
  const commonResourceActions = useCommonResourceActions(kindObj, resource);
  const actions = React.useMemo(
    () => [
      getHealthChecksAction(kindObj, resource),
      ...pdbActions,
      addStorageAction,
      ...commonResourceActions,
    ],
    [kindObj, resource, pdbActions, addStorageAction, commonResourceActions],
  );

  return [actions, !inFlight, undefined];
};
