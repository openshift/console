import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, RouteKind } from '@console/internal/module/k8s';
import { getRoutesForServices } from '../utils';
import { useServicesWatcher } from './useServicesWatcher';

export const useRoutesWatcher = (
  resource: K8sResourceKind,
): { loaded: boolean; loadError: string; routes: RouteKind[] } => {
  const { namespace } = resource.metadata;
  const watchedServices = useServicesWatcher(resource);
  const [allRoutes, loaded, loadError] = useK8sWatchResource<RouteKind[]>({
    isList: true,
    kind: 'Route',
    namespace,
  });

  const servicesNames = React.useMemo(
    () =>
      !watchedServices.loadError && watchedServices.loaded
        ? watchedServices.services.map((s) => s.metadata.name)
        : [],
    [watchedServices.loadError, watchedServices.loaded, watchedServices.services],
  );

  const routes = React.useMemo(() => getRoutesForServices(servicesNames, allRoutes), [
    servicesNames,
    allRoutes,
  ]);

  return {
    loaded: loaded && watchedServices.loaded,
    loadError: loadError || watchedServices.loadError,
    routes,
  };
};
