import * as React from 'react';
import { useRoutesWatcher } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getRoutesURL } from '../utils/topology-utils';

export const useRoutesURL = (resource: K8sResourceKind): string => {
  const routeResources = useRoutesWatcher(resource);

  const routes = routeResources.loaded && !routeResources.loadError ? routeResources.routes : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const url = React.useMemo(() => getRoutesURL(resource, routes), [routes]);

  return url;
};
