import { useMemo } from 'react';
import { DeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { DeploymentKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { DeploymentActionCreator, CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useDeploymentActions } from '../hooks/useDeploymentActions';

export const useDeploymentActionsProvider = (resource: DeploymentKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [deploymentActionsObject, deploymentActionsReady] = useDeploymentActions(
    kindObj,
    resource,
    [
      DeploymentActionCreator.PauseRollout,
      DeploymentActionCreator.RestartRollout,
      DeploymentActionCreator.UpdateStrategy,
      DeploymentActionCreator.EditResourceLimits,
      DeploymentActionCreator.EditDeployment,
    ] as const,
  );

  const [commonActions, commonActionsReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.Delete,
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.AddStorage,
  ] as const);

  const isReady = commonActionsReady || deploymentActionsReady;

  const deploymentActions = useMemo<Action[]>(() => {
    return !isReady
      ? []
      : [
          ...(relatedHPAs?.length === 0 ? [commonActions.ModifyCount] : []),
          ...hpaActions,
          ...pdbActions,
          deploymentActionsObject.PauseRollout,
          deploymentActionsObject.RestartRollout,
          getHealthChecksAction(kindObj, resource),
          commonActions.AddStorage,
          deploymentActionsObject.UpdateStrategy,
          deploymentActionsObject.EditResourceLimits,
          commonActions.ModifyLabels,
          commonActions.ModifyAnnotations,
          deploymentActionsObject.EditDeployment,
          ...(resource.metadata?.annotations?.['openshift.io/generated-by'] ===
          'OpenShiftWebConsole'
            ? [DeleteResourceAction(kindObj, resource)]
            : [commonActions.Delete]),
        ];
  }, [
    hpaActions,
    pdbActions,
    kindObj,
    relatedHPAs,
    resource,
    commonActions,
    isReady,
    deploymentActionsObject,
  ]);

  return [deploymentActions, !inFlight, undefined];
};
