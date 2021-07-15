import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { isHelmResource, isOperatorBackedService, useActiveNamespace } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { doesHpaMatch } from '@console/shared/src/utils/hpa-utils';
import { HorizontalPodAutoscalerKind } from '../../../../../public/module/k8s/types';
import { CommonActionFactory } from '../creators/common-factory';
import { DeploymentActionFactory } from '../creators/deployment-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { getHpaActions } from '../creators/hpa-factory';

type DeployementActionExtraResources = {
  hpas: HorizontalPodAutoscalerKind[];
  csvs: ClusterServiceVersionKind[];
};

export const useDeploymentActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [namespace] = useActiveNamespace();
  const watchedResources = React.useMemo(
    () => ({
      hpas: {
        isList: true,
        kind: HorizontalPodAutoscalerModel.kind,
        namespace,
        optional: true,
      },
      csvs: {
        isList: true,
        kind: referenceForModel(ClusterServiceVersionModel),
        namespace,
        optional: true,
      },
    }),
    [namespace],
  );
  const extraResources = useK8sWatchResources<DeployementActionExtraResources>(watchedResources);
  const relatedHPAs = React.useMemo(() => extraResources.hpas.data.filter(doesHpaMatch(resource)), [
    extraResources,
    resource,
  ]);
  const supportsHPA = React.useMemo(
    () => !isHelmResource(resource) || !isOperatorBackedService(resource, extraResources.csvs.data),
    [extraResources.csvs.data, resource],
  );

  const deploymentActions = React.useMemo(
    () => [
      getHealthChecksAction(kindObj, resource),
      ...(relatedHPAs?.length > 0 ? [CommonActionFactory.ModifyCount(kindObj, resource)] : []),
      ...(supportsHPA ? getHpaActions(kindObj, resource, relatedHPAs) : []),
      DeploymentActionFactory.PauseAction(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource),
      DeploymentActionFactory.UpdateStrategy(kindObj, resource),
      DeploymentActionFactory.EditResourceLimits(kindObj, resource),
      CommonActionFactory.ModifyLabels(kindObj, resource),
      CommonActionFactory.ModifyAnnotations(kindObj, resource),
      DeploymentActionFactory.EditDeployment(kindObj, resource),
      CommonActionFactory.Delete(kindObj, resource),
    ],
    [kindObj, relatedHPAs, resource, supportsHPA],
  );

  return [deploymentActions, !inFlight, undefined];
};
