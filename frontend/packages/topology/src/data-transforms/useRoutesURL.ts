import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useRoutesWatcher } from '@console/shared';
import { getRoutesURL } from '../utils/topology-utils';

export const useRoutesURL = (resource: K8sResourceKind): string => {
  const routeResources = useRoutesWatcher(resource);

  const routes = routeResources.loaded && !routeResources.loadError ? routeResources.routes : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const url = React.useMemo(() => getRoutesURL(resource, routes), [routes]);

  return url;
};
