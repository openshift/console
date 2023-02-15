import { getClusterPrefixedPath } from '@console/app/src/components/detect-cluster/useClusterPrefixedPath';
import { ALL_NAMESPACES_KEY } from '../constants/common';

export const formatNamespacedRouteForResource = (
  resource: string,
  namespace: string,
  cluster?: string,
): string => {
  const path =
    namespace === ALL_NAMESPACES_KEY
      ? `/k8s/all-namespaces/${resource}`
      : `/k8s/ns/${namespace}/${resource}`;
  return getClusterPrefixedPath(path, cluster);
};

export const formatNamespacedRouteForHref = (href: string, namespace: string) =>
  namespace === ALL_NAMESPACES_KEY ? `${href}/all-namespaces` : `${href}/ns/${namespace}`;
