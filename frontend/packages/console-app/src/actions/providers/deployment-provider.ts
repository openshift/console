import * as React from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { DeploymentKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory } from '../creators/common-factory';
import { DeploymentActionFactory } from '../creators/deployment-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useDeploymentActionsProvider = (resource: DeploymentKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);

  const deploymentActions = React.useMemo<Action[]>(
    () => [
      ...(relatedHPAs?.length === 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      ...pdbActions,
      DeploymentActionFactory.PauseRollout(kindObj, resource),
      DeploymentActionFactory.RestartRollout(kindObj, resource),
      getHealthChecksAction(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource),
      DeploymentActionFactory.UpdateStrategy(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      DeploymentActionFactory.EditDeployment(kindObj, resource),
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [DeleteResourceAction(kindObj, resource)]
        : [CommonActionFactory.Delete(kindObj, resource)]),
    ],
    [hpaActions, pdbActions, kindObj, relatedHPAs, resource],
  );

  return [deploymentActions, !inFlight, undefined];
};
