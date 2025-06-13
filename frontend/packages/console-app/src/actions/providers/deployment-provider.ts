import * as React from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { DeploymentKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonActionFactory } from '../creators/common-factory';
import { DeploymentActionFactory } from '../creators/deployment-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useDeploymentActionsProvider = (resource: DeploymentKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const actionFactory = useCommonActionFactory();
  const deploymentActions = React.useMemo<Action[]>(
    () => [
      ...(relatedHPAs?.length === 0 ? [actionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      ...pdbActions,
      DeploymentActionFactory.PauseRollout(kindObj, resource),
      DeploymentActionFactory.RestartRollout(kindObj, resource),
      getHealthChecksAction(kindObj, resource),
      actionFactory.AddStorage(kindObj, resource),
      DeploymentActionFactory.UpdateStrategy(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      actionFactory.ModifyLabels(kindObj, resource),
      actionFactory.ModifyAnnotations(kindObj, resource),
      DeploymentActionFactory.EditDeployment(kindObj, resource),
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [DeleteResourceAction(kindObj, resource)]
        : [actionFactory.Delete(kindObj, resource)]),
    ],
    [hpaActions, pdbActions, kindObj, relatedHPAs, resource, actionFactory],
  );

  return [deploymentActions, !inFlight, undefined];
};
