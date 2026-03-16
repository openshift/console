import { useParams } from 'react-router';
import { useActiveNamespace } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';

/**
 * Hook to get the namespace from URL params or active namespace selector.
 *
 * For routes with explicit namespace (/k8s/ns/:ns/:plural), returns the URL param.
 * For routes without namespace (/k8s/all-namespaces/:plural), returns the active
 * namespace from the selector, converting ALL_NAMESPACES_KEY to undefined.
 *
 * @returns The namespace string or undefined for all-namespaces view
 */
export const useNamespaceFromURL = (): string | undefined => {
  const params = useParams<{ ns?: string }>();
  const [activeNamespace] = useActiveNamespace();

  // Use namespace from URL params if available, otherwise use active namespace
  // Convert ALL_NAMESPACES_KEY to undefined for the all-namespaces routes
  return params.ns || (activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace);
};
