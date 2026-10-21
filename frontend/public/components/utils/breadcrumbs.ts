import i18next from 'i18next';
import { K8sKind } from '../../module/k8s';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { breadcrumbsForGlobalConfig } from '../cluster-settings/global-config';

export const getLastNamespace = () => sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);

export const getBreadcrumbPath = (params: any, customPlural?: string) => {
  if (params.ns) {
    return getLastNamespace() === ALL_NAMESPACES_KEY
      ? `/k8s/all-namespaces/${customPlural || params.plural}`
      : `/k8s/ns/${params.ns}/${customPlural || params.plural}`;
  }
  return `/k8s/cluster/${customPlural || params.plural}`;
};

export const breadcrumbsForDetailsPage = (kindObj: K8sKind, params: any, location: any) => () =>
  (kindObj.apiGroup === 'config.openshift.io' && params.name === 'cluster') ||
  kindObj.apiGroup === 'operator.openshift.io'
    ? breadcrumbsForGlobalConfig(i18next.t(kindObj.labelKey) || kindObj.label, location.pathname)
    : [
        {
          name:
            (kindObj.labelPluralKey && i18next.t(kindObj.labelPluralKey)) || kindObj.labelPlural,
          path: getBreadcrumbPath(params),
        },
        {
          name: i18next.t('public~{{kind}} details', {
            kind: (kindObj.labelKey && i18next.t(kindObj.labelKey)) || kindObj.label,
          }),
          path: `${location.pathname}`,
        },
      ];
