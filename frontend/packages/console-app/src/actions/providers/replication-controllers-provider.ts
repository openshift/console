import * as React from 'react';
import * as _ from 'lodash';
import { DeploymentConfigModel } from '@console/internal/models';
import { ReplicationControllerKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind, useActiveCluster } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory, getCommonResourceActions } from '../creators/common-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { ReplicationControllerFactory } from '../creators/replication-controller-factory';

export const useReplicationControllerActionsProvider = (resource: ReplicationControllerKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [cluster] = useActiveCluster();
  const deploymentPhase = resource?.metadata?.annotations?.['openshift.io/deployment.phase'];
  const dcName = getOwnerNameByKind(resource, DeploymentConfigModel);

  const actions = React.useMemo(
    () => [
      CommonActionFactory.ModifyCount(kindObj, resource),
      ...(!_.isNil(deploymentPhase) && ['New', 'Pending', 'Running'].includes(deploymentPhase)
        ? [ReplicationControllerFactory.CancelRollout(kindObj, resource)]
        : []),
      ...pdbActions,
      CommonActionFactory.AddStorage(kindObj, resource, undefined, undefined, cluster),
      ...(!deploymentPhase || resource?.status?.replicas > 0 || !dcName
        ? []
        : [ReplicationControllerFactory.RollbackDeploymentConfigAction(kindObj, resource)]),
      ...getCommonResourceActions(kindObj, resource, undefined, cluster),
    ],
    [kindObj, resource, deploymentPhase, pdbActions, dcName, cluster],
  );

  return [actions, !inFlight, undefined];
};
