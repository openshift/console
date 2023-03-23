import * as React from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { DeploymentKind, referenceFor } from '@console/internal/module/k8s';
import { useActiveCluster } from '@console/shared/src';
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
  const [cluster] = useActiveCluster();

  const deploymentActions = React.useMemo(
    () => [
      ...(relatedHPAs?.length === 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      ...pdbActions,
      DeploymentActionFactory.PauseRollout(kindObj, resource),
      DeploymentActionFactory.RestartRollout(kindObj, resource),
      getHealthChecksAction(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource, undefined, undefined, cluster),
      DeploymentActionFactory.UpdateStrategy(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      DeploymentActionFactory.EditDeployment(kindObj, resource, undefined, undefined, cluster),
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [DeleteResourceAction(kindObj, resource)]
        : [CommonActionFactory.Delete(kindObj, resource)]),
    ],
    [relatedHPAs, kindObj, resource, hpaActions, pdbActions, cluster],
  );

  return [deploymentActions, !inFlight, undefined];
};

export const useDeploymentConfigActionsProvider = (resource: DeploymentKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [cluster] = useActiveCluster();

  const deploymentConfigActions = React.useMemo(
    () => [
      ...(relatedHPAs?.length === 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...hpaActions,
      ...pdbActions,
      getHealthChecksAction(kindObj, resource),
      DeploymentActionFactory.StartDCRollout(kindObj, resource),
      DeploymentActionFactory.PauseRollout(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource, undefined, undefined, cluster),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      DeploymentActionFactory.EditDeployment(kindObj, resource, undefined, undefined, cluster),
      ...(resource.metadata.annotations?.['openshift.io/generated-by'] === 'OpenShiftWebConsole'
        ? [DeleteResourceAction(kindObj, resource)]
        : [CommonActionFactory.Delete(kindObj, resource)]),
    ],
    [relatedHPAs, kindObj, resource, hpaActions, pdbActions, cluster],
  );

  return [deploymentConfigActions, !inFlight, undefined];
};
