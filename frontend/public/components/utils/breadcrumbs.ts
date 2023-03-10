import i18next from 'i18next';
import { K8sKind } from '../../module/k8s';
import { getClusterPrefixedPath } from '@console/app/src/components/detect-cluster/useClusterPrefixedPath';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { breadcrumbsForGlobalConfig } from '../cluster-settings/global-config';

export const getLastNamespace = () => sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);

export const getBreadcrumbPath = (match: any, customPlural?: string, cluster?: string) => {
  if (match.params.ns) {
    return getLastNamespace() === ALL_NAMESPACES_KEY
      ? getClusterPrefixedPath(
          `/k8s/all-namespaces/${customPlural || match.params.plural}`,
          cluster,
        )
      : getClusterPrefixedPath(
          `/k8s/ns/${match.params.ns}/${customPlural || match.params.plural}`,
          cluster,
        );
  }
  return getClusterPrefixedPath(`/k8s/cluster/${customPlural || match.params.plural}`, cluster);
};

export const breadcrumbsForDetailsPage = (kindObj: K8sKind, match: any, cluster: string) => () =>
  (kindObj.apiGroup === 'config.openshift.io' && match.params.name === 'cluster') ||
  kindObj.apiGroup === 'operator.openshift.io'
    ? breadcrumbsForGlobalConfig(i18next.t(kindObj.labelKey) || kindObj.label, match.url, cluster)
    : [
        {
          name:
            (kindObj.labelPluralKey && i18next.t(kindObj.labelPluralKey)) || kindObj.labelPlural,
          path: getBreadcrumbPath(match, undefined, cluster),
        },
        {
          name: i18next.t('public~{{kind}} details', {
            kind: (kindObj.labelKey && i18next.t(kindObj.labelKey)) || kindObj.label,
          }),
          path: `${match.url}`,
        },
      ];
