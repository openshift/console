import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonActionFactory, useCommonResourceActions } from '../creators/common-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useDaemonSetActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const actionFactory = useCommonActionFactory();
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = React.useMemo(
    () => [
      getHealthChecksAction(kindObj, resource),
      ...pdbActions,
      actionFactory.AddStorage(kindObj, resource),
      ...commonActions,
    ],
    [kindObj, resource, pdbActions, actionFactory, commonActions],
  );

  return [actions, !inFlight, undefined];
};
