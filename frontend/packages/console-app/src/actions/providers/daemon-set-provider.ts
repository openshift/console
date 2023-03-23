import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useActiveCluster } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory, getCommonResourceActions } from '../creators/common-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useDaemonSetActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [cluster] = useActiveCluster();

  const actions = React.useMemo(
    () => [
      getHealthChecksAction(kindObj, resource),
      ...pdbActions,
      CommonActionFactory.AddStorage(kindObj, resource, undefined, undefined, cluster),
      ...getCommonResourceActions(kindObj, resource, undefined, cluster),
    ],
    [kindObj, resource, pdbActions, cluster],
  );

  return [actions, !inFlight, undefined];
};
