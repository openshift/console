import { useMemo } from 'react';
import { useDeleteResourceAction } from '@console/dev-console/src/actions/context-menu';
import type { Action } from '@console/dynamic-plugin-sdk/src';
import type { DeploymentKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { useHPAActions } from '../creators/hpa-factory';
import { DeploymentActionCreator, CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useDeploymentActions } from '../hooks/useDeploymentActions';
import { usePDBActions } from '../hooks/usePDBActions';

export const useDeploymentActionsProvider = (resource: DeploymentKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [hpaActions, relatedHPAs] = useHPAActions(kindObj, resource);
  const [pdbActions] = usePDBActions(kindObj, resource);
  const deleteResourceAction = useDeleteResourceAction(kindObj, resource);
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
            ? [deleteResourceAction]
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
    deleteResourceAction,
  ]);

  return [deploymentActions, !inFlight, undefined];
};
