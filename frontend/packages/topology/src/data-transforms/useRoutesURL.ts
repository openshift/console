import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useRoutesWatcher } from '@console/shared';
import { ROUTE_DISABLED_ANNOTATION, ROUTE_URL_ANNOTATION } from '../const';
import { getRoutesURL } from '../utils/topology-utils';

export const useRoutesURL = (resource: K8sResourceKind): string => {
  const disabled = resource?.metadata?.annotations?.[ROUTE_DISABLED_ANNOTATION] === 'true';
  const annotationURL = resource?.metadata?.annotations?.[ROUTE_URL_ANNOTATION];

  const routeResources = useRoutesWatcher(resource);
  const routes = routeResources.loaded && !routeResources.loadError ? routeResources.routes : [];
  const watchedURL = React.useMemo(() => getRoutesURL(resource, routes), [resource, routes]);

  const url = annotationURL || watchedURL;
  if (disabled || !url || !(url.startsWith('http://') || url.startsWith('https://'))) {
    return null;
  }
  return url;
};
