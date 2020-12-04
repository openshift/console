import { K8sKind } from '@console/internal/module/k8s';

export const HelmChartRepositoryModel: K8sKind = {
  apiGroup: 'helm.openshift.io',
  apiVersion: 'v1beta1',
  kind: 'HelmChartRepository',
  id: 'helmchartrepository',
  plural: 'helmchartrepositories',
  label: 'Helm Chart Repository',
  labelPlural: 'Helm Chart Repositories',
  abbr: 'HCR',
  namespaced: false,
  crd: true,
};
