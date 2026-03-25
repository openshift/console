import { useMemo } from 'react';
import * as _ from 'lodash';
import { DeploymentConfigModel } from '@console/internal/models';
import type { ReplicationControllerKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionCreator, ReplicationControllerActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';
import { usePDBActions } from '../hooks/usePDBActions';
import { useReplicationControllerActions } from '../hooks/useReplicationControllerActions';

export const useReplicationControllerActionsProvider = (resource: ReplicationControllerKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentPhase = resource?.metadata?.annotations?.['openshift.io/deployment.phase'];
  const dcName = getOwnerNameByKind(resource, DeploymentConfigModel);
  const [commonActions, commonActionsReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.AddStorage,
  ] as const);
  const commonResourceActions = useCommonResourceActions(kindObj, resource);
  const [rcActions, rcActionsReady] = useReplicationControllerActions(kindObj, resource, [
    ReplicationControllerActionCreator.CancelRollout,
    ReplicationControllerActionCreator.RollbackDeploymentConfig,
  ]);
  const isReady = commonActionsReady && rcActionsReady;

  const actions = useMemo(
    () =>
      !isReady
        ? []
        : [
            commonActions.ModifyCount,
            ...(!_.isNil(deploymentPhase) && ['New', 'Pending', 'Running'].includes(deploymentPhase)
              ? [rcActions.CancelRollout]
              : []),
            ...pdbActions,
            commonActions.AddStorage,
            ...(!deploymentPhase ||
            (resource?.status?.replicas && resource?.status?.replicas > 0) ||
            !dcName
              ? []
              : [rcActions.RollbackDeploymentConfig]),
            ...commonResourceActions,
          ],
    [
      resource,
      pdbActions,
      deploymentPhase,
      dcName,
      commonActions,
      commonResourceActions,
      rcActions,
      isReady,
    ],
  );

  return [actions, !inFlight, undefined];
};
