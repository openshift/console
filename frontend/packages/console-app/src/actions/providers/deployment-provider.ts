import * as React from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { DeploymentKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { DeploymentActionFactory } from '../creators/deployment-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

export const useDeploymentActionsProvider = (resource: DeploymentKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);

  const commonActions = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.Delete,
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.AddStorage,
  ] as const);

  const deploymentActions = React.useMemo<Action[]>(
    () => [
      ...(relatedHPAs?.length === 0 ? [commonActions.ModifyCount] : []),
      ...hpaActions,
      ...pdbActions,
      DeploymentActionFactory.PauseRollout(kindObj, resource),
      DeploymentActionFactory.RestartRollout(kindObj, resource),
      getHealthChecksAction(kindObj, resource),
      commonActions.AddStorage,
      DeploymentActionFactory.UpdateStrategy(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      commonActions.ModifyLabels,
      commonActions.ModifyAnnotations,
      DeploymentActionFactory.EditDeployment(kindObj, resource),
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [DeleteResourceAction(kindObj, resource)]
        : [commonActions.Delete]),
    ],
    [hpaActions, pdbActions, kindObj, relatedHPAs, resource, commonActions],
  );

  return [deploymentActions, !inFlight, undefined];
};
