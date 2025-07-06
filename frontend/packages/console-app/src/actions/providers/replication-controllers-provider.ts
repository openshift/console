import * as React from 'react';
import * as _ from 'lodash';
import { DeploymentConfigModel } from '@console/internal/models';
import { ReplicationControllerKind, referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePDBActions } from '../creators/pdb-factory';
import { ReplicationControllerFactory } from '../creators/replication-controller-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useReplicationControllerActionsProvider = (resource: ReplicationControllerKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentPhase = resource?.metadata?.annotations?.['openshift.io/deployment.phase'];
  const dcName = getOwnerNameByKind(resource, DeploymentConfigModel);
  const [commonActions, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.AddStorage,
  ] as const);
  const commonResourceActions = useCommonResourceActions(kindObj, resource);

  const actions = React.useMemo(
    () =>
      !isReady
        ? []
        : [
            commonActions.ModifyCount,
            ...(!_.isNil(deploymentPhase) && ['New', 'Pending', 'Running'].includes(deploymentPhase)
              ? [ReplicationControllerFactory.CancelRollout(kindObj, resource)]
              : []),
            ...pdbActions,
            commonActions.AddStorage,
            ...(!deploymentPhase || resource?.status?.replicas > 0 || !dcName
              ? []
              : [ReplicationControllerFactory.RollbackDeploymentConfigAction(kindObj, resource)]),
            ...commonResourceActions,
          ],
    [
      kindObj,
      resource,
      pdbActions,
      deploymentPhase,
      dcName,
      commonActions,
      commonResourceActions,
      isReady,
    ],
  );

  return [actions, !inFlight, undefined];
};
