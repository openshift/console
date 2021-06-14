import * as React from 'react';
import * as _ from 'lodash';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { DeploymentModel } from '@console/internal/models';
import {
  apiVersionForModel,
  K8sResourceCommon,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import {
  getReplicaSetsForResource,
  PodControllerOverviewItem,
  useDeepCompareMemoize,
  useDebounceCallback,
} from '@console/shared';

export const usePodsForRevisions = (
  revisionIds: string | string[],
  namespace: string,
): { loaded: boolean; loadError: string; pods: PodControllerOverviewItem[] } => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [pods, setPods] = React.useState<PodControllerOverviewItem[]>([]);
  const revisions = useDeepCompareMemoize(Array.isArray(revisionIds) ? revisionIds : [revisionIds]);
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

  const updateResults = React.useCallback(
    (updatedResources) => {
      const errorKey = Object.keys(updatedResources).find((key) => updatedResources[key].loadError);
      if (errorKey) {
        setLoadError(updatedResources[errorKey].loadError?.message);
        return;
      }
      if (
        Object.keys(updatedResources).length > 0 &&
        Object.keys(updatedResources).every((key) => updatedResources[key].loaded)
      ) {
        const revisionsPods = revisions.reduce((acc, uid) => {
          const associatedDeployment = _.filter(
            updatedResources?.deployments?.data,
            ({ metadata: { ownerReferences } }) =>
              _.some(ownerReferences, {
                uid,
                controller: true,
              }),
          );
          if (associatedDeployment?.[0]) {
            const depObj: K8sResourceKind = {
              ...associatedDeployment[0],
              apiVersion: apiVersionForModel(DeploymentModel),
              kind: DeploymentModel.kind,
            };
            acc.push(...getReplicaSetsForResource(depObj, updatedResources));
          }
          return acc;
        }, []);
        setLoaded(true);
        setLoadError(null);
        setPods(revisionsPods);
      }
    },
    [revisions],
  );

  const debouncedUpdateResources = useDebounceCallback(updateResults, 250);

  React.useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({ loaded, loadError, pods });
};
