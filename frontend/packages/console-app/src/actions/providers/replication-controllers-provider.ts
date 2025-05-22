import * as React from 'react';
import * as _ from 'lodash';
import { DeploymentConfigModel } from '@console/internal/models';
import { ReplicationControllerKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions, useCommonActionFactory } from '../creators/common-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { ReplicationControllerFactory } from '../creators/replication-controller-factory';

export const useReplicationControllerActionsProvider = (resource: ReplicationControllerKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentPhase = resource?.metadata?.annotations?.['openshift.io/deployment.phase'];
  const dcName = getOwnerNameByKind(resource, DeploymentConfigModel);
  const actionFactory = useCommonActionFactory();
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = React.useMemo(
    () => [
      actionFactory.ModifyCount(kindObj, resource),
      ...(!_.isNil(deploymentPhase) && ['New', 'Pending', 'Running'].includes(deploymentPhase)
        ? [ReplicationControllerFactory.CancelRollout(kindObj, resource)]
        : []),
      ...pdbActions,
      actionFactory.AddStorage(kindObj, resource),
      ...(!deploymentPhase || resource?.status?.replicas > 0 || !dcName
        ? []
        : [ReplicationControllerFactory.RollbackDeploymentConfigAction(kindObj, resource)]),
      ...commonActions,
    ],
    [kindObj, resource, pdbActions, deploymentPhase, dcName, commonActions, actionFactory],
  );

  return [actions, !inFlight, undefined];
};
