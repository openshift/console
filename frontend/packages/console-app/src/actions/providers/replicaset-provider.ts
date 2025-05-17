import * as React from 'react';
import { DeploymentModel } from '@console/internal/models';
import { ReplicaSetKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions, useCommonActionFactory } from '../creators/common-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { ReplicaSetFactory } from '../creators/replicaset-factory';

export const useReplicaSetActionsProvider = (resource: ReplicaSetKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentName = getOwnerNameByKind(resource, DeploymentModel);
  const actionFactory = useCommonActionFactory();
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = React.useMemo(
    () => [
      actionFactory.ModifyCount(kindObj, resource),
      ...pdbActions,
      actionFactory.AddStorage(kindObj, resource),
      ...(resource?.status?.replicas > 0 || !deploymentName
        ? []
        : [ReplicaSetFactory.RollbackDeploymentAction(kindObj, resource)]),
      ...commonActions,
    ],
    [kindObj, resource, pdbActions, deploymentName, actionFactory, commonActions],
  );

  return [actions, !inFlight, undefined];
};
