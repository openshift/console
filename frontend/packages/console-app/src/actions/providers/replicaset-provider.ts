import * as React from 'react';
import { DeploymentModel } from '@console/internal/models';
import { ReplicaSetKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePDBActions } from '../creators/pdb-factory';
import { ReplicaSetFactory } from '../creators/replicaset-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useReplicaSetActionsProvider = (resource: ReplicaSetKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentName = getOwnerNameByKind(resource, DeploymentModel);
  const commonActions = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.AddStorage,
  ] as const);
  const commonResourceActions = useCommonResourceActions(kindObj, resource);

  const actions = React.useMemo(
    () => [
      commonActions.ModifyCount,
      ...pdbActions,
      commonActions.AddStorage,
      ...commonResourceActions,
      ...(resource?.status?.replicas > 0 || !deploymentName
        ? []
        : [ReplicaSetFactory.RollbackDeploymentAction(kindObj, resource)]),
    ],
    [kindObj, resource, pdbActions, deploymentName, commonResourceActions, commonActions],
  );

  return [actions, !inFlight, undefined];
};
