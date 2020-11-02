import * as React from 'react';
import {
  apiVersionForModel,
  K8sResourceCommon,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import {
  getOwnedResources,
  getReplicaSetsForResource,
  PodControllerOverviewItem,
} from '@console/shared/src';
import { DeploymentModel } from '@console/internal/models';

export const usePodsForRevisions = (
  revisionResources: K8sResourceKind[],
  namespace: string,
): { loaded: boolean; loadError: string; pods: PodControllerOverviewItem[] } => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [pods, setPods] = React.useState<PodControllerOverviewItem[]>();
  const watchedResources = React.useMemo(
    () => ({
      deployments: {
        isList: true,
        kind: 'Deployment',
        namespace,
      },
      replicaSets: {
        isList: true,
        kind: 'ReplicaSet',
        namespace,
      },
      pods: {
        isList: true,
        kind: 'Pod',
        namespace,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  React.useEffect(() => {
    const errorKey = Object.keys(resources).find((key) => resources[key].loadError);
    if (errorKey) {
      setLoadError(resources[errorKey].loadError);
      return;
    }
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const revisionsPods = [];
      revisionResources.forEach((revision) => {
        const associatedDeployment = getOwnedResources(revision, resources.deployments.data);
        if (associatedDeployment?.[0]) {
          const depObj: K8sResourceKind = {
            ...associatedDeployment[0],
            apiVersion: apiVersionForModel(DeploymentModel),
            kind: DeploymentModel.kind,
          };
          revisionsPods.push(...getReplicaSetsForResource(depObj, resources));
        }
      });
      setLoaded(true);
      setLoadError(null);
      setPods(revisionsPods);
    }
  }, [revisionResources, resources]);

  return { loaded, loadError, pods };
};
