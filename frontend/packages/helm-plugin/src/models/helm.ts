import type { K8sKind, K8sModel } from '@console/internal/module/k8s';

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

/** Console-only model for UI (e.g. column width preferences); not a cluster API resource. */
export const HelmReleaseModel: K8sModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'HelmRelease',
  id: 'helmrelease',
  plural: 'helmreleases',
  label: 'Helm Release',
  labelPlural: 'Helm Releases',
  abbr: 'HR',
  namespaced: true,
  crd: true,
};

/** Console-only model for the combined cluster + project Helm repositories list. */
export const HelmRepositoriesCombinedListModel: K8sModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'HelmRepositoriesCombinedList',
  id: 'helmrepositoriescombinedlist',
  plural: 'helmrepositoriescombinedlists',
  label: 'Helm Chart Repositories',
  labelPlural: 'Helm Chart Repositories',
  abbr: 'HCRL',
  namespaced: false,
  crd: true,
};
