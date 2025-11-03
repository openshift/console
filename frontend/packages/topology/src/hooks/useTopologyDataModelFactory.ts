import { useState, useEffect } from 'react';
import { WatchK8sResourcesGeneric } from '@console/dynamic-plugin-sdk';
import { CodeRef } from '@console/dynamic-plugin-sdk/src/types';

/**
 * Resources type that can be:
 * 1. Static WatchK8sResourcesGeneric (from dynamic plugin SDK)
 * 2. CodeRef<() => Promise<WatchK8sResourcesGeneric>> (from dynamic plugin SDK, for dynamic resources)
 */
export type TopologyResourcesType =
  | WatchK8sResourcesGeneric
  | CodeRef<() => Promise<WatchK8sResourcesGeneric>>;

/**
 * Hook to resolve resources from TopologyDataModelFactory extension.
 * Handles:
 * - Static WatchK8sResourcesGeneric objects
 * - Dynamic CodeRef<() => Promise<WatchK8sResourcesGeneric>> for plugins that need runtime fetching
 *
 * @param resources - Resources in any of the supported formats
 * @returns Object with resolved resources (always in Generic format)
 */
export const useResolvedResources = (
  resources?: TopologyResourcesType,
): { resolved: WatchK8sResourcesGeneric | undefined; isGeneric: boolean } => {
  const [resolvedResources, setResolvedResources] = useState<WatchK8sResourcesGeneric | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resources) {
      setResolvedResources(undefined);
      setLoading(false);
      return;
    }

    if (typeof resources === 'function') {
      // CodeRef format: CodeRef<() => Promise<WatchK8sResourcesGeneric>>
      // which is a function that returns Promise<() => Promise<WatchK8sResourcesGeneric>>
      setLoading(true);
      const fetchResources = async () => {
        try {
          const codeRef = (resources as unknown) as CodeRef<
            () => Promise<WatchK8sResourcesGeneric>
          >;
          const getResources = await codeRef();
          const result = await getResources();
          setResolvedResources(result);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to resolve dynamic topology resources:', error);
          setResolvedResources(undefined);
        } finally {
          setLoading(false);
        }
      };
      fetchResources();
    } else {
      // Static WatchK8sResourcesGeneric object
      setResolvedResources(resources as WatchK8sResourcesGeneric);
      setLoading(false);
    }
  }, [resources]);

  return loading
    ? { resolved: undefined, isGeneric: false }
    : { resolved: resolvedResources, isGeneric: true };
};
