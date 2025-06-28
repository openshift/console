import * as React from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { DeploymentConfigKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory } from '../creators/common-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { DeploymentActionCreator } from '../hooks/types';
import { useDeploymentActions } from '../hooks/useDeploymentActions';
import { useRetryRolloutAction } from '../hooks/useRetryRolloutAction';

export const useDeploymentConfigActionsProvider = (resource: DeploymentConfigKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const retryRolloutAction = useRetryRolloutAction(resource);
  const deploymentActions = useDeploymentActions(kindObj, resource, [
    DeploymentActionCreator.StartDCRollout,
    DeploymentActionCreator.PauseRollout,
    DeploymentActionCreator.EditResourceLimits,
    DeploymentActionCreator.EditDeployment,
  ] as const);

  const deploymentConfigActions = React.useMemo(() => {
    const actions = [
      ...(relatedHPAs?.length === 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      ...pdbActions,
      getHealthChecksAction(kindObj, resource),
      deploymentActions.StartDCRollout,
      retryRolloutAction,
      deploymentActions.PauseRollout,
      CommonActionFactory.AddStorage(kindObj, resource),
      deploymentActions.EditResourceLimits,
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      deploymentActions.EditDeployment,
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [DeleteResourceAction(kindObj, resource)]
        : [CommonActionFactory.Delete(kindObj, resource)]),
    ];
    return actions;
  }, [
    resource,
    kindObj,
    hpaActions,
    pdbActions,
    deploymentActions,
    relatedHPAs,
    retryRolloutAction,
  ]);

  return [deploymentConfigActions, !inFlight, undefined];
};
