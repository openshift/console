import * as React from 'react';
import * as _ from 'lodash';
import { DeploymentConfigModel } from '@console/internal/models';
import { ReplicationControllerKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory, getCommonResourceActions } from '../creators/common-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { ReplicationControllerFactory } from '../creators/replication-controller-factory';

export const useReplicationControllerActionsProvider = (resource: ReplicationControllerKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentPhase = resource?.metadata?.annotations?.['openshift.io/deployment.phase'];
  const dcName = getOwnerNameByKind(resource, DeploymentConfigModel);

  const actions = React.useMemo(
    () => [
      CommonActionFactory.ModifyCount(kindObj, resource),
      ...(!_.isNil(deploymentPhase) && ['New', 'Pending', 'Running'].includes(deploymentPhase)
        ? [ReplicationControllerFactory.CancelRollout(kindObj, resource)]
        : []),
      ...pdbActions,
      CommonActionFactory.AddStorage(kindObj, resource),
      ...(!deploymentPhase || resource?.status?.replicas > 0 || !dcName
        ? []
        : [ReplicationControllerFactory.RollbackDeploymentConfigAction(kindObj, resource)]),
      ...getCommonResourceActions(kindObj, resource),
    ],
    [kindObj, resource, pdbActions, deploymentPhase, dcName],
  );

  return [actions, !inFlight, undefined];
};
