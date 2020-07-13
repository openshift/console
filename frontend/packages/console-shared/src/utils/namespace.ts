import { ALL_NAMESPACES_KEY } from '../constants/common';

export const formatNamespacedRouteForResource = (resource, namespace) =>
  namespace === ALL_NAMESPACES_KEY
    ? `/k8s/all-namespaces/${resource}`
    : `/k8s/ns/${namespace}/${resource}`;

export const formatNamespacedRouteForHref = (href: string, namespace: string) =>
  `${href}/ns/${namespace}`;
