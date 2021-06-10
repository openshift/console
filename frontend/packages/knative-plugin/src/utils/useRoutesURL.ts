import * as React from 'react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getRouteData } from '../topology/knative-topology-utils';
import { RouteModel } from '../models';

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
