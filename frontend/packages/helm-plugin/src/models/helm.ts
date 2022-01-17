import { K8sKind, K8sModel } from '@console/internal/module/k8s';

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

export const ProjectHelmChartRepositoryModel: K8sModel = {
  apiGroup: 'helm.openshift.io',
  apiVersion: 'v1beta1',
  kind: 'ProjectHelmChartRepository',
  id: 'projecthelmchartrepository',
  plural: 'projecthelmchartrepositories',
  label: 'Project Helm Chart Repository',
  labelPlural: 'Project Helm Chart Repositories',
  abbr: 'PHCR',
  namespaced: true,
  crd: true,
};
