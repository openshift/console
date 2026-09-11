/** Cluster-scoped list page for Project / Namespace, e.g. `/k8s/cluster/projects`. */
export const getClusterResourceListPath = (plural: string): string => `/k8s/cluster/${plural}`;

/** True when the user is already on that list page (query params must be preserved). */
export const isOnClusterResourceListPage = (pathname: string, plural: string): boolean => {
  const listPath = getClusterResourceListPath(plural);
  return pathname === listPath || pathname === `${listPath}/`;
};
