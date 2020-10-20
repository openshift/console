import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getPodsDataForResource, getResourcesToWatchForPods } from '../utils';
import { PodRCData } from '../types';

export const usePodsWatcher = (
  resource: K8sResourceKind,
  kind?: string,
  namespace?: string,
): { loaded: boolean; loadError: string; podData: PodRCData } => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [podData, setPodData] = React.useState<PodRCData>();
  const watchKind = kind || resource.kind;
  const watchNS = namespace || resource.metadata.namespace;
  const watchedResources = React.useMemo(() => getResourcesToWatchForPods(watchKind, watchNS), [
    watchKind,
    watchNS,
  ]);

  const resources = useK8sWatchResources(watchedResources);

  React.useEffect(() => {
    const errorKey = Object.keys(resources).find((key) => resources[key].loadError);
    if (errorKey) {
      setLoadError(resources[errorKey].loadError);
      return;
    }
    setLoadError('');
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const updatedPods = getPodsDataForResource(resource, watchKind, resources);
      setPodData(updatedPods);
      setLoaded(true);
    }
  }, [watchKind, resource, resources]);

  return { loaded, loadError, podData };
};
