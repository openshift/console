import { useMemo } from 'react';
import { DeploymentModel } from '@console/internal/models';
import { ReplicaSetKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePDBActions } from '../creators/pdb-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { useReplicaSetActions } from '../hooks/useReplicaSetActions';

export const useReplicaSetActionsProvider = (resource: ReplicaSetKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentName = getOwnerNameByKind(resource, DeploymentModel);
  const commonActions = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.AddStorage,
  ] as const);
  const commonResourceActions = useCommonResourceActions(kindObj, resource);
  const replicaSetActions = useReplicaSetActions(kindObj, resource);

  const actions = useMemo(
    () => [
      commonActions.ModifyCount,
      ...pdbActions,
      commonActions.AddStorage,
      ...commonResourceActions,
      ...((resource?.status?.replicas && resource?.status?.replicas > 0) || !deploymentName
        ? []
        : replicaSetActions),
    ],
    [resource, pdbActions, deploymentName, commonResourceActions, commonActions, replicaSetActions],
  );

  return [actions, !inFlight, undefined];
};
