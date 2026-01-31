import { useState, useCallback, useMemo } from 'react';
import * as _ from 'lodash';
import type { WatchK8sResource, WatchK8sResults } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';

type UseDynamicK8sWatchResourcesResult = {
  results: WatchK8sResults<Record<string, WatchK8sResource>>;
  watchResource: (key: string, resource: WatchK8sResource) => void;
  stopWatchResource: (key: string) => void;
};

/**
 * Hook that provides imperative API for dynamically watching K8s resources at runtime.
 *
 * This is a wrapper around useK8sWatchResources that adds imperative watch/stopWatch callbacks,
 * enabling dynamic addition and removal of resources based on runtime conditions (e.g., plugin
 * extensions).
 *
 * Use this hook when:
 * - Resources to watch are determined by plugin extensions at runtime
 * - The number of resources is unknown or variable
 * - You need to conditionally add/remove resources based on props or state changes
 *
 * For static, predetermined resources, use useK8sWatchResource(s) directly instead.
 *
 * @returns An object containing:
 *   - results: Map of resource results keyed by the provided key
 *   - watchResource: Callback to start watching a resource with explicit key
 *   - stopWatchResource: Callback to stop watching a resource by key
 *
 * @example
 * ```tsx
 * const MyCard = ({ namespace }) => {
 *   const { results, watchResource, stopWatchResource } = useDynamicK8sWatchResources();
 *
 *   useEffect(() => {
 *     watchResource('pods', { kind: 'Pod', namespace, isList: true });
 *     return () => stopWatchResource('pods');
 *   }, [namespace]); // callbacks are stable, no need to include them
 *
 *   const pods = results.pods?.data;
 *   const loaded = results.pods?.loaded;
 *   const error = results.pods?.loadError;
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export const useDynamicK8sWatchResources = (): UseDynamicK8sWatchResourcesResult => {
  const [k8sResources, setK8sResources] = useState<Record<string, WatchK8sResource>>({});

  const resourceResults = useK8sWatchResources(k8sResources);

  /**
   * Start watching a K8s resource with explicit key.
   *
   * Resources are marked as optional by default (optional: true) to ensure graceful
   * degradation when watching CRDs or resources that may not be installed or available.
   * This can be overridden by explicitly setting optional: false in the resource config.
   *
   * @param key - Unique key to identify this resource in results
   * @param resource - K8s resource configuration (kind, namespace, isList, etc.)
   */
  const watchResource = useCallback((key: string, resource: WatchK8sResource) => {
    if (!key) {
      // eslint-disable-next-line no-console
      console.warn(
        '[useDynamicK8sWatchResources] watchResource called without key - resource will not be watched',
      );
      return;
    }
    setK8sResources((prev) => {
      // Only update if the resource config has changed
      const existing = prev[key];
      // Default to optional: true for graceful handling of missing or unavailable resources
      const resourceWithDefaults = { ...resource, optional: resource.optional ?? true };
      if (existing && _.isEqual(existing, resourceWithDefaults)) {
        return prev;
      }
      return { ...prev, [key]: resourceWithDefaults };
    });
  }, []);

  /**
   * Stop watching a K8s resource by key.
   *
   * @param key - Unique key identifying the resource to stop watching
   */
  const stopWatchResource = useCallback((key: string) => {
    if (!key) {
      // eslint-disable-next-line no-console
      console.warn(
        '[useDynamicK8sWatchResources] stopWatchResource called without key - no action taken',
      );

      return;
    }

    setK8sResources((prev) => {
      // Only remove if the key exists to avoid unnecessary state updates
      if (!(key in prev)) {
        return prev;
      }
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return useMemo(
    () => ({
      results: resourceResults,
      watchResource,
      stopWatchResource,
    }),
    [resourceResults, watchResource, stopWatchResource],
  );
};
