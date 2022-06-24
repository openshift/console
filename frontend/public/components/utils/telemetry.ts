import { Location } from 'history';

/**
 * Removes sensitive informations from the pathname.
 *
 * At the moment it just removes usernames from
 * `/k8s/cluster/user.openshift.io~v1~User/a-user[...]`
 */
export const withoutSensitiveInformations = (location: Location): Location => {
  let pathname = location.pathname;
  if (pathname.startsWith('/k8s/cluster/user.openshift.io~v1~User/')) {
    pathname = pathname.replace(/User\/[^/]+/, 'User/removed-username');
  }
  return {
    pathname,
    search: location.search,
    state: location.state,
    hash: location.hash,
    key: location.key,
  };
};
