import * as React from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { DeploymentKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory } from '../creators/common-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { DeploymentActionCreator } from '../hooks/types';
import { useDeploymentActions } from '../hooks/useDeploymentActions';

export const useDeploymentActionsProvider = (resource: DeploymentKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deploymentActionsObject = useDeploymentActions(kindObj, resource, [
    DeploymentActionCreator.PauseRollout,
    DeploymentActionCreator.RestartRollout,
    DeploymentActionCreator.UpdateStrategy,
    DeploymentActionCreator.EditResourceLimits,
    DeploymentActionCreator.EditDeployment,
  ] as const);

  const deploymentActions = React.useMemo<Action[]>(
    () => [
      ...(relatedHPAs?.length === 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      ...pdbActions,
      deploymentActionsObject.PauseRollout,
      deploymentActionsObject.RestartRollout,
      getHealthChecksAction(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource),
      deploymentActionsObject.UpdateStrategy,
      deploymentActionsObject.EditResourceLimits,
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      deploymentActionsObject.EditDeployment,
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [DeleteResourceAction(kindObj, resource)]
        : [CommonActionFactory.Delete(kindObj, resource)]),
    ],
    [hpaActions, pdbActions, deploymentActionsObject, kindObj, relatedHPAs, resource],
  );

  return [deploymentActions, !inFlight, undefined];
};
