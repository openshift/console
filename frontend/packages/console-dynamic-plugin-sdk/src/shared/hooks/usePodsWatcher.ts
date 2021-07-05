import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PodRCData } from '../types';
import { getPodsDataForResource, getResourcesToWatchForPods } from '../utils';
import { useDebounceCallback } from './debounce';
import { useDeepCompareMemoize } from './deep-compare-memoize';

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

  const updateResults = React.useCallback(
    (watchedResource, updatedResources) => {
      const errorKey = Object.keys(updatedResources).find((key) => updatedResources[key].loadError);
      if (errorKey) {
        setLoadError(updatedResources[errorKey].loadError);
        return;
      }
      setLoadError('');
      if (
        Object.keys(updatedResources).length > 0 &&
        Object.keys(updatedResources).every((key) => updatedResources[key].loaded)
      ) {
        const updatedPods = getPodsDataForResource(watchedResource, watchKind, updatedResources);
        setPodData(updatedPods);
        setLoaded(true);
      }
    },
    [watchKind],
  );

  const debouncedUpdateResources = useDebounceCallback(updateResults, 250);

  React.useEffect(() => {
    debouncedUpdateResources(resource, resources);
  }, [debouncedUpdateResources, resources, resource]);

  return useDeepCompareMemoize({ loaded, loadError, podData });
};
