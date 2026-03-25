import { useState, useMemo, useCallback, useEffect } from 'react';
import * as _ from 'lodash';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { DeploymentModel } from '@console/internal/models';
import type { K8sResourceCommon, K8sResourceKind } from '@console/internal/module/k8s';
import { apiVersionForModel } from '@console/internal/module/k8s';
import type { PodControllerOverviewItem } from '@console/shared';
import { getReplicaSetsForResource } from '@console/shared';
import { useDebounceCallback } from '@console/shared/src/hooks/useDebounceCallback';
import { useDeepCompareMemoize } from '@console/shared/src/hooks/useDeepCompareMemoize';

export const usePodsForRevisions = (
  revisionIds: string | string[],
  namespace: string,
): { loaded: boolean; loadError: string; pods: PodControllerOverviewItem[] } => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [pods, setPods] = useState<PodControllerOverviewItem[]>([]);
  const revisions = useDeepCompareMemoize(Array.isArray(revisionIds) ? revisionIds : [revisionIds]);
  const watchedResources = useMemo(
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

  const updateResults = useCallback(
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

  useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({ loaded, loadError, pods });
};
