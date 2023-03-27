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

export const getTelemetryTitle = () => {
  const titleElement = document.querySelector('title');
  const titleValue = titleElement.getAttribute('data-telemetry');
  if (!titleValue) {
    const { productName } = getBrandingDetails();
    const pageTitleValue = document.title;
    const titleArray = pageTitleValue.split(' · ');
    const last = titleArray[titleArray.length - 1];
    if (titleArray.length === 1) {
      return pageTitleValue;
    } else if (titleArray.length && last === productName) {
      const newTelemetrytitle = pageTitleValue.replace(` · ${productName}`, '');
      return newTelemetrytitle;
    }
  }
  return titleValue || document.title;
};
