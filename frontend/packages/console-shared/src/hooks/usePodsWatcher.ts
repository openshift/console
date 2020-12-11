import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getPodsDataForResource, getResourcesToWatchForPods } from '../utils';
import { useDeepCompareMemoize } from './deep-compare-memoize';
import { PodRCData } from '../types';
import { useDebounceCallback } from './debounce';

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
    (updatedResources) => {
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
        const updatedPods = getPodsDataForResource(resource, watchKind, updatedResources);
        setPodData(updatedPods);
        setLoaded(true);
      }
    },
    // Don't update on a resource change, we want the debounce callback to be consistent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watchKind],
  );

  const debouncedUpdateResources = useDebounceCallback<any>(updateResults, [updateResults], 250);

  React.useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources, updateResults]);

  return useDeepCompareMemoize({ loaded, loadError, podData });
};
