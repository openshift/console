import i18next from 'i18next';
import { K8sKind } from '../../module/k8s';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { getActiveNamespace } from '../../actions/ui';

export const getBreadcrumbPath = (match: any, customPlural?: string) => {
  const lastNamespace = getActiveNamespace();
  if (match.params.ns) {
    return lastNamespace === ALL_NAMESPACES_KEY
      ? `/k8s/all-namespaces/${customPlural || match.params.plural}`
      : `/k8s/ns/${match.params.ns}/${customPlural || match.params.plural}`;
  }
  return `/k8s/cluster/${customPlural || match.params.plural}`;
};

export const breadcrumbsForDetailsPage = (kindObj: K8sKind, match: any) => () => [
  {
    name: `${kindObj.labelPlural}`,
    path: getBreadcrumbPath(match),
  },
  {
    name: i18next.t('details-page~{{kind}} details', { kind: kindObj.label }),
    path: `${match.url}`,
  },
];
