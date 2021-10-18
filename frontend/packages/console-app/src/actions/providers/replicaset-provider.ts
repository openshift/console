import * as React from 'react';
import { DeploymentModel } from '@console/internal/models';
import { ReplicaSetKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory, getCommonResourceActions } from '../creators/common-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { ReplicaSetFactory } from '../creators/replicaset-factory';

export const useReplicaSetActionsProvider = (resource: ReplicaSetKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentName = getOwnerNameByKind(resource, DeploymentModel);

  const actions = React.useMemo(
    () => [
      CommonActionFactory.ModifyCount(kindObj, resource),
      ...pdbActions,
      CommonActionFactory.AddStorage(kindObj, resource),
      ...(resource?.status?.replicas > 0 || !deploymentName
        ? []
        : [ReplicaSetFactory.RollbackDeploymentAction(kindObj, resource)]),
      ...getCommonResourceActions(kindObj, resource),
    ],
    [kindObj, resource, pdbActions, deploymentName],
  );

  return [actions, !inFlight, undefined];
};
