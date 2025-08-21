import { useMemo, useCallback, useEffect } from 'react';
import { useSafetyFirst } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PodRCData } from '../types';
import { getPodsDataForResource, getResourcesToWatchForPods } from '../utils';
import { useDebounceCallback } from './debounce';
import { useDeepCompareMemoize } from './deep-compare-memoize';

/**
 * Watches for all Pods for a kind and namespace.
 * Kind and namespace is used from the given `resource` and can be overridden
 * with the `kind` and `namespace` parameters.
 */
export const usePodsWatcher = (
  resource: K8sResourceKind,
  kind?: string,
  namespace?: string,
): { loaded: boolean; loadError: string; podData: PodRCData } => {
  const [loaded, setLoaded] = useSafetyFirst<boolean>(false);
  const [loadError, setLoadError] = useSafetyFirst<string>('');
  const [podData, setPodData] = useSafetyFirst<PodRCData>(undefined);
  const watchKind = kind || resource?.kind;
  const watchNS = namespace || resource?.metadata.namespace;
  const watchedResources = useMemo(
    () => (watchKind ? getResourcesToWatchForPods(watchKind, watchNS) : {}),
    [watchKind, watchNS],
  );

  const resources = useK8sWatchResources(watchedResources);

  const updateResults = useCallback(
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
    [setLoadError, setLoaded, setPodData, watchKind],
  );

  const debouncedUpdateResources = useDebounceCallback(updateResults, 250);

  useEffect(() => {
    debouncedUpdateResources(resource, resources);
  }, [debouncedUpdateResources, resources, resource]);

  return useDeepCompareMemoize({ loaded, loadError, podData });
};
