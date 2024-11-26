import { Location } from 'history';
import { getBrandingDetails } from '../masthead';

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

const titleProductNameSuffix = ` · ${getBrandingDetails().productName}`;

export const getTelemetryTitle = () => {
  const titleElement = document.querySelector('title');
  let title = titleElement.getAttribute('data-telemetry') || document.title;
  if (title.endsWith(titleProductNameSuffix)) {
    title = title.substring(0, title.length - titleProductNameSuffix.length);
  }
  return title;
};
