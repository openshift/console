import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getServicesForResource } from '../utils';

export const useServicesWatcher = (
  resource: K8sResourceKind,
): { loaded: boolean; loadError: string; services: K8sResourceKind[] } => {
  const { namespace } = resource.metadata;
  const [allServices, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: 'Service',
    namespace,
  });

  const services = React.useMemo(
    () => (!loadError && loaded ? getServicesForResource(resource, allServices) : []),
    [allServices, loadError, loaded, resource],
  );

  return { loaded, loadError, services };
};
