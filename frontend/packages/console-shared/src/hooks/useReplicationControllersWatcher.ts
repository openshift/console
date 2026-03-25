import { useMemo } from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import type { PodControllerOverviewItem } from '../types';
import { getReplicationControllersForResource } from '../utils';

export const useReplicationControllersWatcher = (
  resource: K8sResourceKind,
): {
  loaded: boolean;
  loadError: string;
  mostRecentRC: K8sResourceKind;
  visibleReplicationControllers: PodControllerOverviewItem[];
} => {
  const { namespace } = resource.metadata;
  const watchedResources = useMemo(
    () => ({
      replicationControllers: {
        isList: true,
        kind: 'ReplicationController',
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
  const resources = useK8sWatchResources(watchedResources);

  const { loaded, loadError, mostRecentRC, visibleReplicationControllers } = useMemo(() => {
    const resourcesLoaded =
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded);
    const resourceWithLoadError = Object.values(resources).find((r) => r.loadError);
    if (!resourcesLoaded || resourceWithLoadError) {
      return {
        loaded: resourcesLoaded,
        loadError: resourceWithLoadError ? resourceWithLoadError.loadError : null,
        mostRecentRC: null,
        visibleReplicationControllers: [],
      };
    }

    return {
      loaded: true,
      loadError: null,
      ...getReplicationControllersForResource(resource, resources),
    };
  }, [resources, resource]);

  return { loaded, loadError, mostRecentRC, visibleReplicationControllers };
};
