import { useMemo } from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { getServicesForResource } from '../utils';

export const useServicesWatcher = (
  resource: K8sResourceKind,
): { loaded: boolean; loadError: string; services: K8sResourceKind[] } => {
  const namespace = resource?.metadata?.namespace || '';
  const [allServices, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: 'Service',
    namespace,
  });

  const services = useMemo(
    () => (!loadError && loaded ? getServicesForResource(resource, allServices) : []),
    [allServices, loadError, loaded, resource],
  );

  return { loaded, loadError, services };
};
