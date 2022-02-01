import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ROUTE_DISABLED_ANNOTATION, ROUTE_URL_ANNOTATION } from '@console/topology/src/const';
import { RouteModel } from '../models';
import { getRoutesURL } from '../topology/knative-topology-utils';

export const useRoutesURL = (resource: K8sResourceKind): string => {
  const { namespace, annotations } = resource.metadata;
  const disabled = annotations?.[ROUTE_DISABLED_ANNOTATION] === 'true';
  const annotationURL = annotations?.[ROUTE_URL_ANNOTATION];

  // Don't watch for routes if we know the URL already.
  const [allRoutes, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(
    disabled || annotationURL
      ? {}
      : {
          // TODO: Can we fetch only the releated routes here?
          isList: true,
          kind: referenceForModel(RouteModel),
          namespace,
          optional: true,
        },
  );

  const routes = React.useMemo(() => (loaded && !loadError ? allRoutes : []), [
    loaded,
    loadError,
    allRoutes,
  ]);
  const watchedURL = React.useMemo(() => getRoutesURL(resource, routes), [resource, routes]);

  const url = annotationURL || watchedURL;
  if (disabled || !url || !(url.startsWith('http://') || url.startsWith('https://'))) {
    return null;
  }
  return url;
};
