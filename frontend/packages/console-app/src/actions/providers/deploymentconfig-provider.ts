import * as React from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { DeploymentConfigKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { CommonActionCreator, DeploymentActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useDeploymentActions } from '../hooks/useDeploymentActions';
import { useRetryRolloutAction } from '../hooks/useRetryRolloutAction';

export const useDeploymentConfigActionsProvider = (resource: DeploymentConfigKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const retryRolloutAction = useRetryRolloutAction(resource);
  const [deploymentActions, deploymentActionsReady] = useDeploymentActions(kindObj, resource, [
    DeploymentActionCreator.StartDCRollout,
    DeploymentActionCreator.PauseRollout,
    DeploymentActionCreator.EditResourceLimits,
    DeploymentActionCreator.EditDeployment,
  ] as const);

  const [commonActions, commonActionsReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.Delete,
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.AddStorage,
  ] as const);

  const isReady = commonActionsReady || deploymentActionsReady;

  const deploymentConfigActions = React.useMemo(
    () =>
      isReady
        ? [
            ...(relatedHPAs?.length === 0 ? [commonActions.ModifyCount] : []),
            ...hpaActions,
            ...pdbActions,
            getHealthChecksAction(kindObj, resource),
            deploymentActions.StartDCRollout,
            retryRolloutAction,
            deploymentActions.PauseRollout,
            commonActions.AddStorage,
            deploymentActions.EditResourceLimits,
            commonActions.ModifyLabels,
            commonActions.ModifyAnnotations,
            deploymentActions.EditDeployment,
            ...(resource.metadata?.annotations?.['openshift.io/generated-by'] ===
            'OpenShiftWebConsole'
              ? [DeleteResourceAction(kindObj, resource)]
              : [commonActions.Delete]),
          ]
        : [],
    [
      resource,
      kindObj,
      hpaActions,
      pdbActions,
      relatedHPAs,
      retryRolloutAction,
      commonActions,
      deploymentActions,
      isReady,
    ],
  );

  return [deploymentConfigActions, !inFlight, undefined];
};
