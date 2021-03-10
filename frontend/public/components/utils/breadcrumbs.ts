import { K8sKind } from '../../module/k8s';
import { TFunction } from 'i18next';
import { ResourceLabel, ResourceLabelPlural } from '../../models/hypercloud/resource-plural';

export const breadcrumbsForDetailsPage = (kindObj: K8sKind, match: any, t?: TFunction) => () => [
  {
    name: ResourceLabelPlural(kindObj, t),
    path: match.params.ns
      ? `/k8s/ns/${match.params.ns}/${match.params.plural}`
      : `/k8s/cluster/${match.params.plural}`,
  },
  { name: t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', {0: ResourceLabel(kindObj, t)}), path: `${match.url}` },
];
