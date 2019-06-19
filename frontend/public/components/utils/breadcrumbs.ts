import { K8sKind } from '../../module/k8s';

export const breadcrumbsForDetailsPage = (kindObj: K8sKind, match: any) => () => [
  {name: `${kindObj.labelPlural}`, path: match.params.ns ? `/k8s/ns/${match.params.ns}/${match.params.plural}` : `/k8s/cluster/${match.params.plural}`},
  {name: `${kindObj.label} Details`, path: `${match.url}`},
];
