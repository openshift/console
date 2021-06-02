import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { RouteModel } from '../models';
import { getRouteData } from '../topology/knative-topology-utils';

export const useRoutesURL = (resource: K8sResourceKind): string => {
  const { namespace } = resource.metadata;
  const [allRoutes, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(RouteModel),
    namespace,
    optional: true,
  });

  const routes = loaded && !loadError ? allRoutes : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const url = React.useMemo(() => getRouteData(resource, routes), [routes]);

  return url;
};
