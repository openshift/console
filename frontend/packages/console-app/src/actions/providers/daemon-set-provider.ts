import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory, getCommonResourceActions } from '../creators/common-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useDaemonSetActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);

  const actions = React.useMemo(
    () => [
      getHealthChecksAction(kindObj, resource),
      ...pdbActions,
      CommonActionFactory.AddStorage(kindObj, resource),
      ...getCommonResourceActions(kindObj, resource),
    ],
    [kindObj, resource, pdbActions],
  );

  return [actions, !inFlight, undefined];
};
