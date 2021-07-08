import i18next from 'i18next';
import { K8sKind } from '../../module/k8s';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { breadcrumbsForGlobalConfig } from '../cluster-settings/global-config';

export const getLastNamespace = () => sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);

export const getBreadcrumbPath = (match: any, customPlural?: string) => {
  if (match.params.ns) {
    return getLastNamespace() === ALL_NAMESPACES_KEY
      ? `/k8s/all-namespaces/${customPlural || match.params.plural}`
      : `/k8s/ns/${match.params.ns}/${customPlural || match.params.plural}`;
  }
  return `/k8s/cluster/${customPlural || match.params.plural}`;
};

export const breadcrumbsForDetailsPage = (kindObj: K8sKind, match: any) => () =>
  (kindObj.apiGroup === 'config.openshift.io' && match.params.name === 'cluster') ||
  kindObj.apiGroup === 'operator.openshift.io'
    ? breadcrumbsForGlobalConfig(i18next.t(kindObj.labelKey) || kindObj.label, match.url)
    : [
        {
          name: i18next.t(kindObj.labelPluralKey) || kindObj.labelPlural,
          path: getBreadcrumbPath(match),
        },
        {
          name: i18next.t('public~{{kind}} details', {
            kind: i18next.t(kindObj.labelKey) || kindObj.label,
          }),
          path: `${match.url}`,
        },
      ];
