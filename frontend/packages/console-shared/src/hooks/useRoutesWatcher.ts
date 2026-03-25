import { useMemo } from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import { getRoutesForServices } from '../utils';
import { useServicesWatcher } from './useServicesWatcher';

export const useRoutesWatcher = (
  resource: K8sResourceKind,
): { loaded: boolean; loadError: string; routes: RouteKind[] } => {
  const watchedServices = useServicesWatcher(resource);
  const [allRoutes, loaded, loadError] = useK8sWatchResource<RouteKind[]>({
    isList: true,
    kind: 'Route',
    namespace: resource?.metadata?.namespace,
  });

  const servicesNames = useMemo(
    () =>
      !watchedServices.loadError && watchedServices.loaded
        ? watchedServices.services.map((s) => s.metadata?.name)
        : [],
    [watchedServices.loadError, watchedServices.loaded, watchedServices.services],
  );

  const routes = useMemo(() => getRoutesForServices(servicesNames, allRoutes), [
    servicesNames,
    allRoutes,
  ]);

  return {
    loaded: loaded && watchedServices.loaded,
    loadError: loadError || watchedServices.loadError,
    routes,
  };
};
