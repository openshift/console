import { K8sKind } from '../../module/k8s';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';

export const getBreadcrumbPath = (match: any, customPlural?: string) => {
  const lastNamespace = localStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);
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
  { name: `${kindObj.label} Details`, path: `${match.url}` },
];
