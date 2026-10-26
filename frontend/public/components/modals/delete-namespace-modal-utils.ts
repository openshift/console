/** Cluster-scoped list page for Project / Namespace, e.g. `/k8s/cluster/projects`. */
export const getClusterResourceListPath = (plural: string): string => `/k8s/cluster/${plural}`;

/**
 * `window.location.pathname` includes the console base path. React Router
 * pathnames do not. Return the router path, without a trailing slash.
 */
const toRouterPathname = (pathname: string): string => {
  const { basePath } = window.SERVER_FLAGS;
  const prefix = basePath.length > 1 ? basePath.replace(/\/+$/, '') : '';
  let path = pathname;

  if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) {
    path = path.slice(prefix.length) || '/';
  }
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
  }
  return path;
};

/** True when the user is already on that list page (query params must be preserved). */
export const isOnClusterResourceListPage = (pathname: string, plural: string): boolean =>
  toRouterPathname(pathname) === getClusterResourceListPath(plural);
