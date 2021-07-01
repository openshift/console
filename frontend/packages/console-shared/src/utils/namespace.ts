import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk';

export const formatNamespacedRouteForResource = (resource, namespace) =>
  namespace === ALL_NAMESPACES_KEY
    ? `/k8s/all-namespaces/${resource}`
    : `/k8s/ns/${namespace}/${resource}`;

export const formatNamespacedRouteForHref = (href: string, namespace: string) =>
  namespace === ALL_NAMESPACES_KEY ? `${href}/all-namespaces` : `${href}/ns/${namespace}`;
