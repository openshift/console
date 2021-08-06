import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory } from '../creators/common-factory';
import { DeploymentActionFactory } from '../creators/deployment-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';

export const useDeploymentActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);

  const deploymentActions = React.useMemo(
    () => [
      ...(relatedHPAs?.length === 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      getHealthChecksAction(kindObj, resource),
      DeploymentActionFactory.PauseRollout(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource),
      DeploymentActionFactory.UpdateStrategy(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      DeploymentActionFactory.EditDeployment(kindObj, resource),
      CommonActionFactory.Delete(kindObj, resource),
    ],
    [hpaActions, kindObj, relatedHPAs, resource],
  );

  return [deploymentActions, !inFlight, undefined];
};

export const useDeploymentConfigActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);

  const deploymentConfigActions = React.useMemo(
    () => [
      ...(relatedHPAs?.length === 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      getHealthChecksAction(kindObj, resource),
      DeploymentActionFactory.StartDCRollout(kindObj, resource),
      DeploymentActionFactory.PauseRollout(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      DeploymentActionFactory.EditDeployment(kindObj, resource),
      CommonActionFactory.Delete(kindObj, resource),
    ],
    [hpaActions, kindObj, relatedHPAs, resource],
  );

  return [deploymentConfigActions, !inFlight, undefined];
};
