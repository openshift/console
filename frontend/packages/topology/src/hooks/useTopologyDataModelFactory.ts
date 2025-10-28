import { useState, useEffect } from 'react';
import { WatchK8sResources, WatchK8sResourcesGeneric } from '@console/dynamic-plugin-sdk';
import { CodeRef } from '@console/dynamic-plugin-sdk/src/types';

/**
 * Resources type that can be:
 * 1. Static WatchK8sResourcesGeneric (from dynamic plugin SDK)
 * 2. CodeRef<() => Promise<WatchK8sResourcesGeneric>> (from dynamic plugin SDK, for dynamic resources)
 * 3. Function (namespace: string) => WatchK8sResources (from old internal plugin system or converted dynamic plugins)
 */
export type TopologyResourcesType =
  | WatchK8sResourcesGeneric
  | CodeRef<() => Promise<WatchK8sResourcesGeneric>>
  | ((namespace: string) => WatchK8sResources<any>);

/**
 * Hook to resolve resources from TopologyDataModelFactory extension.
 * Handles:
 * - Static WatchK8sResourcesGeneric objects
 * - Dynamic CodeRef<() => Promise<WatchK8sResourcesGeneric>> for plugins that need runtime fetching
 * - Legacy/converted function format (namespace: string) => WatchK8sResources
 *
 * @param resources - Resources in any of the supported formats
 * @param namespace - Current namespace (needed for legacy function format)
 * @returns Object with resolved resources and whether they're in Generic format (need conversion)
 */
export const useResolvedResources = (
  resources?: TopologyResourcesType,
  namespace?: string,
): {
  resolved: WatchK8sResources<any> | WatchK8sResourcesGeneric | undefined;
  isGeneric: boolean;
} => {
  const [resolvedResources, setResolvedResources] = useState<
    WatchK8sResources<any> | WatchK8sResourcesGeneric | undefined
  >(undefined);
  const [isGeneric, setIsGeneric] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resources) {
      setResolvedResources(undefined);
      setIsGeneric(false);
      setLoading(false);
      return;
    }

    if (typeof resources === 'function') {
      // Check if it's a legacy function (namespace: string) => WatchK8sResources
      // or a CodeRef () => Promise<WatchK8sResourcesGeneric>
      // We can distinguish by checking the function length (legacy has 1 param, CodeRef has 0)
      if (resources.length === 1) {
        // Legacy/converted format: (namespace: string) => WatchK8sResources
        if (namespace) {
          try {
            const result = (resources as (namespace: string) => WatchK8sResources<any>)(namespace);
            setResolvedResources(result);
            setIsGeneric(false); // Already converted
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to resolve legacy topology resources:', error);
            setResolvedResources(undefined);
            setIsGeneric(false);
          }
        } else {
          setResolvedResources(undefined);
          setIsGeneric(false);
        }
        setLoading(false);
      } else {
        // CodeRef format: () => Promise<WatchK8sResourcesGeneric>
        setLoading(true);
        const fetchResources = async () => {
          try {
            const codeRef = (resources as unknown) as () => Promise<WatchK8sResourcesGeneric>;
            const result = await codeRef();
            setResolvedResources(result);
            setIsGeneric(true); // Needs conversion
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to resolve dynamic topology resources:', error);
            setResolvedResources(undefined);
            setIsGeneric(false);
          } finally {
            setLoading(false);
          }
        };
        fetchResources();
      }
    } else {
      // Static WatchK8sResourcesGeneric object
      setResolvedResources(resources as WatchK8sResourcesGeneric);
      setIsGeneric(true); // Needs conversion
      setLoading(false);
    }
  }, [resources, namespace]);

  return loading
    ? { resolved: undefined, isGeneric: false }
    : { resolved: resolvedResources, isGeneric };
};
