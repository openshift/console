/* eslint-disable no-undef, no-unused-vars */

import { K8sKind } from '../module/k8s';

export const AlphaCatalogEntryModel: K8sKind = {
  kind: 'AlphaCatalogEntry-v1',
  label: 'AlphaCatalogEntry-v1',
  labelPlural: 'AlphaCatalogEntry-v1s',
  basePath: '/apis/app.coreos.com/',
  apiVersion: 'v1alpha1',
  path: 'alphacatalogentry-v1s',
  abbr: 'CE',
  namespaced: true,
  plural: 'alphacatalogentry-v1s',
};

export const ClusterServiceVersionModel: K8sKind = {
  kind: 'ClusterServiceVersion-v1',
  label: 'ClusterServiceVersion-v1',
  labelPlural: 'ClusterServiceVersion-v1s',
  basePath: '/apis/app.coreos.com/',
  apiVersion: 'v1alpha1',
  path: 'clusterserviceversion-v1s',
  abbr: 'CSV',
  namespaced: true,
  plural: 'clusterserviceversion-v1s',
};

export const InstallPlanModel: K8sKind = {
  kind: 'InstallPlan-v1',
  label: 'InstallPlan-v1',
  labelPlural: 'InstallPlan-v1s',
  basePath: '/apis/app.coreos.com/',
  apiVersion: 'v1alpha1',
  path: 'installplan-v1s',
  abbr: 'IP',
  namespaced: true,
  plural: 'installplan-v1s',
};
